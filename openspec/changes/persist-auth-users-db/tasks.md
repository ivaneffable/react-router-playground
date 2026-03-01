## 1. Neon database setup

- [x] 1.1 Sign up at [console.neon.tech](https://console.neon.tech/signup) and create a project (default `production` branch is created)
- [x] 1.2 Create a `development` branch from `production` (Branches → Create branch in Neon Console)
- [x] 1.3 Run the `users` table SQL (design §6 Step 3) on both `production` and `development` branches (Neon SQL Editor)
- [x] 1.4 Copy connection strings for each branch; add `DATABASE_URL` to local `.env` (development branch) and document Netlify production env (production branch)

## 2. Dependencies and persistence layer

- [x] 2.1 Add `@neondatabase/serverless` as a dependency
- [x] 2.2 Create server-only module (e.g. `app/lib/user.server.ts`) that reads `DATABASE_URL` from env and exports `upsertUser({ id, email, name })` using raw SQL (INSERT ... ON CONFLICT (id) DO UPDATE)
- [x] 2.3 Export `getUserById(id)` returning user or null (for future use; optional for this change)
- [x] 2.4 Ensure DB failures throw or return a detectable error so the callback can handle them

## 3. Auth callback: upsert before session

- [x] 3.1 In the auth callback loader, after obtaining user identity (id, email, name) from Google and before creating the session: call `upsertUser({ id, email, name })`
- [x] 3.2 If upsert throws or fails: do not create session; redirect to an error page or render an error state on the callback route; log the failure (no PII)
- [x] 3.3 If upsert succeeds: continue with existing flow (create session cookie, redirect to home)
- [x] 3.4 Error UI: users see a clear message when sign-in could not be completed (implemented in root layout when `auth_error=sign_in_failed`; no separate `/auth/error` route)

## 4. Verification

- [ ] 4.1 With `DATABASE_URL` set to development branch: sign in with Google; confirm user row is created in Neon (Tables or SQL Editor on development branch)
- [ ] 4.2 Sign in again with the same Google account; confirm the same row is updated (email/name/updated_at) and session is still created
- [ ] 4.3 Simulate upsert failure (e.g. wrong `DATABASE_URL` or disconnect DB); confirm no session is set and user sees an error (no redirect to home as if signed in)
- [ ] 4.4 Confirm root loader and session behavior are unchanged (user still from session only; no DB read in root loader)
