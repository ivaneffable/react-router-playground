## Why

We currently identify users only in the session (signed cookie): id, email, and name live in the cookie for its lifetime and are lost when the session ends. Persisting these in a database gives us a stable identity across sessions, enables future user-specific features (e.g. preferences, history, protected content), and keeps a record of who has signed in without changing how auth works today.

## What Changes

- Persist authenticated user (id, email, name) to a database when they sign in: create a new user row on first sign-in, or update name/email on subsequent sign-ins if we already have that user.
- Keep the existing auth flow: Google OAuth callback still exchanges the code, obtains user identity, and creates the session cookie; we add a step to upsert the user in the database before or after creating the session.
- Introduce a database and a small persistence layer (e.g. "upsert user by id"); no change to routes, session shape, or how the app reads the current user (still from the root loader / session).

## Capabilities

### New Capabilities

- `user-persistence`: Store user by id (from Google); create on first sign-in, update name/email on later sign-ins. Read user by id when needed (e.g. for profile or admin). Database choice and client are part of this capability.

### Modified Capabilities

- `auth-session` / auth callback: After successful Google sign-in and token exchange, upsert the user in the database (id, email, name), then create the session as today. Session behavior and cookie shape stay the same.

## Impact

- **Backend / database:** New database (free tier, scalable; choice to be made in design) and a client or API to run upserts/reads. Environment variables for connection (e.g. URL, key).
- **Auth callback:** One additional step in the callback flow: upsert user, then create session and redirect. No change to redirect URLs or route structure.
- **Dependencies:** DB client or SDK for the chosen solution (e.g. Turso, Neon, Supabase—to be decided in design).
