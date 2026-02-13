## ADDED Requirements

### Requirement: Session storage after sign-in

The system SHALL persist the authenticated user's identity (id, email, name) in a session that survives navigation and page reloads. The session MUST be stored in an HTTP-only, Secure cookie (either a session identifier with server-side storage or a signed token such as a JWT). The session MUST NOT be readable or writable by client-side JavaScript. No user record SHALL be persisted in a database; identity exists only for the lifetime of the session.

#### Scenario: Session is set on successful sign-in

- **WHEN** the user completes the Google OAuth callback successfully (see google-sign-in spec)
- **THEN** the system MUST set a session (cookie or signed token in cookie) containing the user identity (id, email, name)
- **AND** the cookie MUST be HTTP-only and Secure (when served over HTTPS)

#### Scenario: Session does not persist users in a store

- **WHEN** the system creates or updates a session after sign-in
- **THEN** the system MUST NOT create or update a user record in a database or external store
- **AND** the only representation of the user for the app is the session payload

### Requirement: Current user available to the application

The system SHALL expose the current user (or null if unauthenticated) to the application on each request. A root loader (or equivalent layout loader) MUST read and validate the session cookie, and MUST return an object such as `{ user: { id, email, name } | null }` so that routes and components can branch on authentication state (e.g. show "Sign in" vs "Sign out", display name).

#### Scenario: Authenticated request returns user

- **WHEN** a request includes a valid session cookie (valid signature or valid session id with server-side data)
- **THEN** the root (or layout) loader MUST return the user identity (id, email, name) for that session
- **AND** routes and components SHALL be able to read this data (e.g. via useRouteLoaderData) to show authenticated UI

#### Scenario: Unauthenticated or invalid session returns null

- **WHEN** a request has no session cookie, an expired session, or an invalid token/session id
- **THEN** the root (or layout) loader MUST return user as null
- **AND** the app SHALL treat the user as signed out

### Requirement: Sign-out clears session

The system SHALL provide a sign-out endpoint or action at `/auth/logout`. When the user signs out, the system MUST clear the session (e.g. clear the session cookie or invalidate the token) and MUST redirect the user to a safe page (e.g. home or login).

#### Scenario: User signs out

- **WHEN** the user requests `/auth/logout` (e.g. GET or POST)
- **THEN** the system MUST clear the session (remove or expire the session cookie / invalidate token)
- **AND** the system MUST respond with a redirect to a designated page (e.g. home)
- **AND** subsequent requests MUST receive user as null until the user signs in again
