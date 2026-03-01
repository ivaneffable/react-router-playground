## ADDED Requirements

### Requirement: Callback upserts user before creating session

When the OAuth callback successfully obtains user identity (id, email, name) from Google, the system SHALL upsert that user in the database (per the user-persistence spec) before creating the session and redirecting. The order of operations SHALL be: validate state, exchange code, obtain identity, upsert user in database, create session cookie, redirect. Session shape (cookie content, HTTP-only, Secure) and the way the app reads the current user (e.g. root loader) SHALL remain unchanged.

#### Scenario: Successful callback persists user then creates session

- **WHEN** the user is redirected to `/auth/callback` with valid `code` and `state` and the system has obtained user identity (id, email, name) from Google
- **THEN** the system MUST upsert the user in the database (create or update by id) before setting the session cookie
- **AND** the system MUST then create the session and redirect as today (session contains id, email, name; cookie is HTTP-only, Secure when applicable)

#### Scenario: Upsert failure stops auth and shows error

- **WHEN** the user is redirected to `/auth/callback` with valid `code` and `state` and the system has obtained user identity (id, email, name) from Google, but the database upsert fails (e.g. DB unavailable, constraint error)
- **THEN** the system MUST NOT create a session or set a session cookie
- **AND** the system MUST show an error to the user by redirecting (e.g. to home) with an error indicator (e.g. query param) and the root layout MUST display a short message (e.g. "Sign-in could not be completed") and a "Try again" link to restart sign-in
- **AND** the system MUST NOT redirect to home as if sign-in succeeded
- **AND** the system MUST log the failure without including PII

#### Scenario: Session and root loader unchanged

- **WHEN** the system has created a session after sign-in (with or without successful user persistence)
- **THEN** the session cookie and its payload (id, email, name) SHALL remain as before (no schema change)
- **AND** the root (or layout) loader SHALL continue to return `{ user: { id, email, name } | null }` from the session only; it need not read from the database for the current user unless design decides otherwise

## MODIFIED Requirements

### Requirement: Session storage after sign-in (supersedes "no user record" constraint)

The existing requirement that "No user record SHALL be persisted in a database; identity exists only for the lifetime of the session" is superseded by this change. The system SHALL now persist the user in the database on sign-in (see user-persistence and the ADDED requirement above). The session itself continues to store identity in the cookie (or signed token in cookie) as before; the database is an additional persistence of the same identity for the lifetime of the application data.
