## Context

The app is a React Router 7 (SSR) site deployed on Netlify, with no existing authentication. Users currently access all routes anonymously. The proposal adds Google Sign-In (OAuth 2.0) and session handling so we can identify users and optionally protect routes or show user-specific UI. Constraints: keep the Client Secret server-side only; use the authorization code flow for web; fit within React Router’s route/loader/action model and Netlify’s serverless runtime.

## Goals / Non-Goals

**Goals:**

- Implement Google OAuth 2.0 authorization-code flow: redirect to Google, receive callback with `code`, exchange code for tokens and user identity on the server.
- Establish a session after successful sign-in (e.g. HTTP-only cookie or signed token), validate it on subsequent requests, and support sign-out.
- Expose current user (or null) to the app (e.g. via root loader or route loaders) so UI can show “Sign in” vs “Sign out” and optional display name.
- Optional: protect selected routes by requiring a valid session and redirecting unauthenticated users (e.g. to home or a login page).

**Non-Goals:**

- Adding other identity providers (e.g. GitHub, Apple) or password-based auth in this change.
- Persisting users in a store/DB; for now we keep session-only (no user table). User identity (id, email, name) lives only in the session for its lifetime.
- Refreshing Google access tokens for calling Google APIs on behalf of the user (only identity/sign-in is in scope unless specified later).

## Decisions

1. **OAuth flow: authorization code (server-side exchange)**

   - **Choice:** Use the authorization code flow. User is redirected to Google; Google redirects back with a `code`; the server exchanges the code for tokens (and optionally fetches userinfo).
   - **Alternatives considered:** Implicit flow is deprecated and not recommended for web. Token exchange must happen on the server to keep the Client Secret secure.
   - **Rationale:** Aligns with OAuth 2.0 best practices for web and keeps the secret off the client.

2. **Where the callback runs: React Router route (loader/action) or resource route**

   - **Choice:** Implement the callback as a React Router route at `/auth/callback` whose loader (or action) receives the `code`, performs the token exchange, sets the session cookie (or signed token), then redirects (e.g. `redirect("/")`).
   - **Alternatives considered:** A separate Netlify serverless function or “resource route” that only handles the callback.
   - **Rationale:** Keeping the callback inside the same React Router app reuses the same server runtime, env vars, and session mechanism; loaders/actions run on the server and can set cookies or return redirects.

3. **Session storage: HTTP-only cookie vs signed token in cookie**

   - **Choice:** Prefer a server-side session identifier stored in an HTTP-only, Secure cookie (e.g. session id), with session data (user id, email, name) stored on the server (e.g. in memory, or a small store/DB). If no server-side store is desired, use a signed token (e.g. JWT) in an HTTP-only cookie; the server verifies the signature and reads user from the token.
   - **Alternatives considered:** LocalStorage or non–HTTP-only cookie for tokens: rejected because of XSS and CSRF exposure.
   - **Rationale:** HTTP-only cookie is not readable by JS, reducing token theft via XSS; server-side validation ensures session can be invalidated (sign-out, revocation).

4. **Session validation and “current user” in the app**

   - **Choice:** A root loader (or a loader used by a layout that wraps authenticated UI) reads the session cookie, validates it, and returns `{ user: { id, email, name } | null }`. Routes and components use this via `useRouteLoaderData` or equivalent so they can branch on “signed in” vs “signed out” and optionally protect routes.
   - **Rationale:** Single place to resolve “current user”; fits React Router’s data-loading model and works with SSR.

5. **Sign-in entry point**

   - **Choice:** A “Sign in with Google” link or button that navigates to `GET /auth/google`, which immediately redirects to Google’s authorization URL (built with Client ID, redirect_uri, scope, state). No client-side OAuth library required for this step; the redirect URL can be built in a loader or in a small server utility.
   - **Rationale:** Simple, no JS required for the first hop; state parameter should be generated and validated to mitigate CSRF.

6. **Sign-out**

   - **Choice:** A route or action at `/auth/logout` (e.g. POST or GET) that clears the session (clear cookie or invalidate token), then redirects to home or login.
   - **Rationale:** Single, explicit sign-out path; server clears the session so the next request sees no user.

7. **Protected routes**

   - **Choice:** For any route that requires auth, the route’s loader checks the session (or root loader data); if no user, redirect to a public page (e.g. home or `/auth/login`). Can be factored into a reusable helper or wrapper.
   - **Rationale:** Keeps protection at the data layer (loader) and avoids rendering sensitive UI before redirect.

8. **Google client configuration**

   - **Choice:** Client ID and Client Secret come from environment variables (e.g. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`). Callback URL `https://<origin>/auth/callback` must be registered in Google Cloud Console. Use the same redirect_uri in both the authorization redirect and the token exchange.
   - **Rationale:** No secrets in source; same pattern as other server-side OAuth apps.

9. **User persistence**
   - **Choice:** Do not persist users in a store/DB for now. Keep session-only: user identity (Google id, email, name) is stored only in the session (cookie or signed token) for the lifetime of that session. No user table or lookup by Google id.
   - **Rationale:** Simplifies the first version (no DB/schema); we can add a user store later when a feature needs a stable identity across sessions.

## Risks / Trade-offs

- **[Risk] Client Secret or tokens leak (e.g. logging, error pages)** → Mitigation: Never log or send tokens or the secret to the client; restrict env vars to server; use HTTP-only cookies so tokens/session id are not in JS.
- **[Risk] Callback URL mismatch (wrong redirect_uri)** → Mitigation: Use a single canonical origin and path for the callback; document the exact callback URL in Google Cloud Console; validate `state` on callback to detect CSRF.
- **[Risk] Session fixation or replay** → Mitigation: Generate a new session on sign-in; use Secure and SameSite cookie attributes; consider short-lived sessions or refresh strategy later.
- **[Trade-off] No server-side session store** → If we use only a signed cookie (e.g. JWT), we cannot revoke sessions until expiry unless we maintain a blocklist. Acceptable for an MVP; can add server-side session store later if we need immediate revocation.

## Migration Plan

1. **Configuration:** Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Netlify (and local `.env`) and register the production and dev callback URLs in Google Cloud Console.
2. **Deploy:** Ship the new auth routes and root loader changes; ensure callback URL is HTTPS in production.
3. **Rollback:** Revert the deploy; existing sessions (cookies) will fail validation and users will appear signed out; no data migration required if we do not persist users beyond the session.

## Google Cloud Console setup

Steps to configure the Google side so the app can use OAuth 2.0 sign-in.

1. **Create or select a Google Cloud project**

   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Use an existing project or create a new one (e.g. “React Router Playground”).
   - Ensure the project is selected in the top bar.

2. **Configure the OAuth consent screen**

   - In the left menu: **APIs & Services** → **OAuth consent screen**.
   - Choose **External** if you want any Google account to sign in (typical for a web app). Choose **Internal** only if the app is for your organization’s Google Workspace users.
   - Fill in **App name**, **User support email**, and **Developer contact email**. Add **Authorized domains** (e.g. your Netlify domain and `localhost` for dev) if required.
   - Under **Scopes**, add the scope needed for basic profile: `.../auth/userinfo.email`, `.../auth/userinfo.profile` (or the “email”, “profile” OpenID Connect scopes). Save.

3. **Create OAuth 2.0 credentials**

   - **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**.
   - **Application type:** **Web application**.
   - **Name:** e.g. “React Router Playground Web”.
   - **Authorized JavaScript origins** (optional for our server-side flow but useful if you ever use client-side APIs):
     - Production: `https://<your-netlify-domain>`
     - Local: `http://localhost:5173` (or the port your dev server uses).
   - **Authorized redirect URIs:** Add the exact callback URLs Google will redirect to after sign-in:
     - Production: `https://<your-netlify-domain>/auth/callback`
     - Local: `http://localhost:<port>/auth/callback` (e.g. `http://localhost:5173/auth/callback`).
   - Create. The console shows **Client ID** and **Client secret**; copy both (the secret is shown only once unless you create a new one).

4. **Use the credentials in the app**
   - Put **Client ID** and **Client secret** in environment variables (e.g. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) in Netlify and in local `.env`. Never commit the secret to the repo.
   - The app must use the **exact** redirect URI that was registered (e.g. `https://your-app.netlify.app/auth/callback`) when building the authorization URL and when calling the token endpoint; otherwise Google will reject the request.

**Reference:** [Google OAuth 2.0 for Web server apps](https://developers.google.com/identity/protocols/oauth2/web-server).

## Open Questions
