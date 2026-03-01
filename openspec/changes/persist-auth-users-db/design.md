## Context

The app is a React Router 7 (SSR) site on Netlify with Google Sign-In and session-only auth: user identity (id, email, name) lives in a signed cookie. This change adds persistence of that identity in a database so we have a stable user record across sessions, without changing session shape or how the app reads the current user (root loader from session only).

Constraints: free database tier; not required to scale today but must scale well later; must work from Netlify serverless (React Router loaders run in that environment).

## Goals / Non-Goals

**Goals:**

- Persist authenticated user (id, email, name) in a database on each successful sign-in (create or update by id).
- Keep the existing auth flow: callback still validates state, exchanges code, obtains identity; we add an upsert step before creating the session.
- Use a free, serverless-friendly database that can scale when needed.
- Leave session cookie and root loader behavior unchanged; no read-from-DB for “current user” in this change unless we explicitly choose otherwise.

**Non-Goals:**

- Migrating or backfilling existing sessions into the DB (only new sign-ins persist).
- Reading the current user from the database in the root loader (session remains the source of truth for “who is logged in”).
- Additional user fields (e.g. avatar, preferences) or multiple identity providers in this change.

## Decisions

### 1. Database choice: Neon (Postgres)

We use **Neon** (serverless Postgres) for user persistence: free tier, works from Netlify serverless via the Neon serverless driver (HTTP-based, no long-lived connections), and scales well as usage grows. Postgres gives us standard SQL, branching for dev/preview if needed later, and a single connection string.

**Environment:** Set `DATABASE_URL` to the Neon connection string for the appropriate branch (see [Preparing the database](#6-preparing-the-database-dev-and-production) below). Server env only (Netlify env vars, not `VITE_*`). Never commit the URL.

### 2. User table schema

- **id** (primary key): string, from Google `sub` (stable).
- **email**: string, required.
- **name**: string, required (or default to email).
- **created_at** (optional): timestamp, set on insert.
- **updated_at** (optional): timestamp, set on insert and update.

No unique constraint beyond `id`; email can change between sign-ins and we do not enforce uniqueness on email in this change.

### 3. Persistence layer

- **Location:** Server-only module (e.g. `app/lib/db.server.ts` or `app/lib/user.server.ts`) so DB credentials are never on the client.
- **Operations:**  
  - `upsertUser({ id, email, name })`: insert or update by id (ON CONFLICT or equivalent).  
  - `getUserById(id)`: return user or null (for future use; not required for the callback flow in this change).
- **Client:** Use **`@neondatabase/serverless`** (Neon’s serverless driver). It uses HTTP under the hood, so it works from Netlify serverless without connection pooling or cold-start issues.

### 4. Callback integration and failure handling

- **Order:** In the auth callback loader: validate state → exchange code → obtain identity → **upsert user in database** → create session cookie → redirect.
- **If upsert fails:** **Show an error and stop the auth process.** Do not create a session; do not redirect to home as if sign-in succeeded. Redirect to an error page (or render an error state on the callback route) so the user knows something went wrong. Log the failure (with no PII) for debugging. This keeps persisted data consistent: we only create sessions when the user is stored in the DB.
- **Logging:** Log upsert failures (with no PII in logs) so we can alert and fix DB/connectivity issues.

### 5. Current user remains from session only

The root loader continues to derive `user` from the session cookie only; it does not read from the database. So “current user” is unchanged; the DB is for persistence and future features (e.g. profile, admin), not for resolving the active session.

### 6. Preparing the database (dev and production)

We use **two Neon instances (branches)** in a single project: one for **production** and one for **development**. Each branch has its own connection string and is fully isolated. This follows [Neon’s branching model](https://neon.com/docs/get-started/workflow-primer): one project per application, with branches for each environment.

References: [Neon documentation](https://neon.com/docs/introduction), [Learn the basics](https://neon.com/docs/get-started/signing-up), [Branching workflow primer](https://neon.com/docs/get-started/workflow-primer). Neon also provides a [React Router setup prompt](https://neon.com/prompts/react-router-prompt.md) and AI-guided setup: `npx neonctl@latest init`.

#### Step 1: Sign up and create a project

1. Sign up at [console.neon.tech](https://console.neon.tech/signup) (email, GitHub, or Google).
2. Create a **Project** (e.g. “react-router-playground”). This is the top-level container. Typically one project per app/repo.
3. Neon creates a default branch named **`production`** — this is the root branch and will be used for production. It has a database (e.g. `neondb`) and a compute (default 0.25–2 CU on Free tier; adjustable).

#### Step 2: Create the development branch

1. In the Neon Console, go to **Branches** and click **Create branch**.
2. **Name:** `development` (or `dev`). Naming tip from Neon: prefix with `dev/` if you add more dev branches later (e.g. `dev/main`).
3. **Parent:** Select `production`. The new branch is an isolated copy of production (schema and, by default, data). For a fresh dev DB with only schema, you can use [schema-only branching](https://neon.com/docs/guides/branching-schema-only) so dev has no production data.
4. Create the branch. Each branch gets its own compute and **unique connection string** (different host); changes in one branch do not affect the other.

**Optional — Neon CLI:** Install with `brew install neonctl` or `npm install -g neonctl`, run `neon auth`, then list branches and get connection strings:

```bash
neon projects list
neon branches list --project-id <project-id>
neon connection-string development --database-name neondb --project-id <project-id>
neon connection-string production --database-name neondb --project-id <project-id>
```

#### Step 3: Create the `users` table on both branches

Run the same SQL on **both** the `production` and `development` branches (e.g. via Neon Console **SQL Editor**, or by connecting with `psql` / your migration tool). Select the branch in the Console before running the query.

```sql
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: trigger to refresh updated_at on update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
```

If you use schema-only branching for dev, create the branch from `production` (which already has the table), or run this SQL on the `development` branch after creating it.

#### Step 4: Get connection strings per branch

- In the Neon Console: select the branch (e.g. **production** or **development**), then open **Connection details** or **Dashboard** to copy the connection string. It looks like:
  `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
- **Production branch** → use this `DATABASE_URL` in **Netlify** (production site env).
- **Development branch** → use this `DATABASE_URL` in **local `.env`** (and optionally in Netlify preview/deploy previews if you want preview envs to use dev DB).

Never commit connection strings; use env vars only.

#### Step 5: Set `DATABASE_URL` per environment

| Environment        | Neon branch   | Where to set `DATABASE_URL`        |
|--------------------|---------------|------------------------------------|
| Local development  | `development` | `.env` in project root (gitignored) |
| Netlify production | `production`  | Netlify site → Environment variables → Production |
| Netlify preview (optional) | `development` or a preview branch | Netlify → Environment variables → Deploy previews |

After deployment, the app will use the production branch in production and the development branch locally (and in previews if configured). You can reset the development branch to production anytime via Console or `neon branches reset development --parent --project-id <id>` to sync schema/data from production (see [Neon branching workflow](https://neon.com/docs/get-started/workflow-primer)).

## Risks / Trade-offs

- **DB availability:** If the DB is down, upsert fails and the user cannot complete sign-in (we show an error and stop). The user can retry after the DB is back, or we fix configuration/connectivity.
- **Secrets:** DB URL/token must be in server env only (Netlify env vars, not `VITE_*`).

## Migration / rollout

1. **Setup:** Follow [Preparing the database (§6)](#6-preparing-the-database-dev-and-production): create Neon project, create `development` branch from `production`, create `users` table on both branches, set `DATABASE_URL` per environment (production branch in Netlify production, development branch in local `.env`).
2. **Deploy:** Add persistence layer and callback upsert; deploy. New sign-ins start persisting; existing sessions are unchanged.
3. **Rollback:** Remove the upsert step (and optional DB client) from the callback; session-only behavior is restored. No need to migrate or delete DB data on rollback.
