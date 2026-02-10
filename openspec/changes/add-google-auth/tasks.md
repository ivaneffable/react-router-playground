## 1. Configuration and environment

- [x] 1.1 Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to local .env (and document Netlify env vars for production)
- [x] 1.2 Add SESSION_SECRET (or equivalent) for signing session/JWT if using signed-token approach

## 2. Session utilities

- [x] 2.1 Implement server-side session helpers: create session (set HTTP-only, Secure cookie with user id/email/name, or signed token), read and verify session from request, clear session
- [x] 2.2 Implement getCurrentUser(request): returns { id, email, name } or null based on session cookie

## 3. Sign-in route (GET /auth/google)

- [x] 3.1 Create route at /auth/google whose loader (or entry) builds Google authorization URL with client_id, redirect_uri (origin + /auth/callback), scope (openid email profile), and cryptographically random state
- [x] 3.2 Store state in a short-lived cookie (or session) before redirecting to Google
- [x] 3.3 Respond with redirect (302/303) to Google's authorization endpoint

## 4. Callback route (GET /auth/callback)

- [x] 4.1 Create route at /auth/callback that reads code and state from query params
- [x] 4.2 Validate state against value stored in cookie/session; if missing or mismatch, redirect to home or error page without exchanging code
- [x] 4.3 Exchange code for tokens with Google token endpoint (server-side, using Client ID and Secret), then obtain user identity (id, email, name) from id_token or userinfo endpoint
- [x] 4.4 On success: create session (set session cookie with user identity), then redirect to home (or intended URL)
- [x] 4.5 On token exchange or userinfo failure: redirect to safe page or return error, do not set session

## 5. Logout route (/auth/logout)

- [x] 5.1 Create route or action at /auth/logout that clears the session cookie (or invalidates session)
- [x] 5.2 Respond with redirect to home (or login page)

## 6. Root loader and auth state

- [x] 6.1 In root (or layout) loader: read session from request via getCurrentUser (or equivalent), return { user: { id, email, name } | null }
- [x] 6.2 Ensure routes and components can access this data (e.g. useRouteLoaderData with root route id)

## 7. UI: Sign in and Sign out

- [x] 7.1 Add "Sign in with Google" link or button that navigates to /auth/google (e.g. in header or layout)
- [x] 7.2 When user is authenticated, show "Sign out" (link to /auth/logout) and optionally display name or email
- [x] 7.3 When user is not authenticated, show "Sign in with Google" only (no Sign out)

## 8. Google Cloud and verification

- [ ] 8.1 Register authorized redirect URI (https://<production-origin>/auth/callback and http://localhost:<port>/auth/callback) in Google Cloud Console OAuth client
- [ ] 8.2 Manually verify: sign-in redirects to Google, callback creates session and redirects home, root returns user, sign-out clears session
