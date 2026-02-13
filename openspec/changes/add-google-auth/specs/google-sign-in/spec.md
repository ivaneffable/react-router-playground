## ADDED Requirements

### Requirement: Sign-in redirect to Google

The system SHALL expose a sign-in entry point at `GET /auth/google`. When the user requests this URL, the system MUST redirect the browser to Google's OAuth 2.0 authorization URL with the correct client_id, redirect_uri, scope, and a cryptographically random state parameter. The redirect_uri MUST be the application's `/auth/callback` URL for the current origin.

#### Scenario: User initiates sign-in

- **WHEN** the user navigates to `/auth/google` (e.g. by clicking "Sign in with Google")
- **THEN** the system responds with an HTTP redirect (302 or 303) to Google's authorization endpoint
- **AND** the redirect URL includes client_id, redirect_uri (e.g. `https://<origin>/auth/callback`), scope (e.g. openid email profile), and state

#### Scenario: State parameter is generated for CSRF protection

- **WHEN** the system builds the redirect to Google for sign-in
- **THEN** the state parameter MUST be a cryptographically random value
- **AND** the state MUST be stored in the session (or otherwise associated with the current request) so it can be validated on callback

### Requirement: OAuth callback and token exchange

The system SHALL handle the OAuth callback at `GET /auth/callback`. When Google redirects the user back with a `code` and `state` in the query string, the system MUST validate the state against the value stored for the session, exchange the code for tokens at Google's token endpoint (using Client ID and Client Secret from environment variables), and obtain the user's identity (id, email, name) from the token response or from Google's userinfo endpoint. The system MUST NOT exchange the code if state validation fails.

#### Scenario: Successful callback creates session

- **WHEN** the user is redirected to `/auth/callback` with valid `code` and `state` query parameters
- **AND** the state matches the value stored for the current session
- **THEN** the system exchanges the code for tokens with Google (server-side, using Client Secret)
- **AND** the system obtains the user identity (id, email, name) from the token or userinfo
- **AND** the system establishes a session (see auth-session spec) with that identity and redirects the user to the application (e.g. home)

#### Scenario: Callback rejects invalid or missing state

- **WHEN** the user is redirected to `/auth/callback` with a `code` but missing or non-matching `state`
- **THEN** the system MUST NOT exchange the code for tokens
- **AND** the system MUST respond with an error (e.g. 400) or redirect to a safe page without creating a session

#### Scenario: Callback handles exchange or userinfo errors

- **WHEN** the token exchange or userinfo request to Google fails (e.g. invalid code, network error)
- **THEN** the system MUST NOT create a session
- **AND** the system MUST respond with an error or redirect to a safe page and optionally surface an error to the user
