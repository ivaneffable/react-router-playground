## Why

Users need a way to sign in with a trusted identity provider without the app managing passwords. Google Sign-In provides a familiar, secure option and reduces friction for adoption. Adding it now establishes an auth foundation for future user-specific features (e.g. saved preferences, protected content).

## What Changes

- Add "Sign in with Google" entry point (button or link) and OAuth 2.0 flow (redirect or popup).
- Handle the OAuth callback: exchange code for tokens, obtain user profile (e.g. email, name), and create or recognize a user in the app.
- Introduce session handling: persist the authenticated state (e.g. HTTP-only cookie or secure token), validate it on requests, and support sign-out.
- Optionally protect certain routes or show user-specific UI (e.g. display name, sign-out) when a session exists.

## Capabilities

### New Capabilities

- `google-sign-in`: Initiating sign-in with Google (OAuth 2.0), redirect/callback handling, token exchange, and obtaining user identity (id, email, name) from Google.
- `auth-session`: Storing and validating the authenticated session (server-side session or signed token), exposing current user to the app, and sign-out (clear session).

### Modified Capabilities

- (None. No existing specs in `openspec/specs/`.)

## Impact

- **Routes**: New routes or path segments for auth (e.g. `/auth/google`, `/auth/callback`, possibly `/auth/logout`).
- **Root/layout**: May need session/session-loader and UI that reflects auth state (e.g. sign-in vs sign-out, user display name).
- **Environment**: Google OAuth client credentials (Client ID, Client Secret) via env vars; callback URL must be registered in Google Cloud Console.
- **Backend**: If using authorization-code flow (recommended for web), a server-side step to exchange the code for tokens and optionally create or look up user; may require a small auth API or server actions.
- **Dependencies**: OAuth client or auth library (e.g. for React Router: server-side code for callback, optional client helpers for sign-in link).
