# First artifact: proposal

Create `proposal.md` in this directory. Use the spec-driven proposal format (Why, What Changes, Capabilities, Impact).

## Context

- **Goal:** Save authenticated user's name and email (and id) in a database.
- **Current state:** Google auth exists; session holds id, email, name in a signed cookie only (no DB).
- **Scope:** Persist these fields on sign-in; choose a free, scalable DB that fits React Router + Netlify serverless.

## Proposal template (spec-driven)

```markdown
## Why

[Why persist users: e.g. stable identity across sessions, future user-specific features.]

## What Changes

- Persist authenticated user (id, email, name) to a database on sign-in (create or update).
- [Any other concrete changes.]

## Capabilities

### New Capabilities

- `user-persistence`: Store user by id; create/update on auth callback.

### Modified Capabilities

- `auth-session` / auth callback: After successful Google sign-in, upsert user row then create session as today.

## Impact

- **Backend/DB:** New database and client; env vars for connection.
- **Auth callback:** After token exchange, upsert user then create session.
- **Dependencies:** DB client for chosen solution.
```
