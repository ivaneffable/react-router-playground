# FAQ: Add Google Auth

Questions and answers from implementation and design review. Use this for later reference or documentation.

## OAuth and security

### Why should the state parameter be generated and validated to mitigate CSRF?

In the OAuth flow, the user is sent to Google and then redirected back to your app with a `code`. That `code` is one-time and valuable. Without **state**: an attacker could trigger a sign-in that completes in the victim’s browser, or (with a malicious redirect_uri) receive the code and send it to your backend.  
**State** ties the callback to the same browser/session that started the flow: you generate a random value, store it (e.g. in a cookie), and send it to Google; when Google redirects back, you check that the `state` in the URL matches the stored value. Only the browser that started the flow has the cookie, so injected or cross-site callback requests can be rejected.

### What is the scope for? (openid email profile)

**Scope** tells Google what your app is allowed to know about the user. You send it in the authorization request; the user consents on the Google sign-in screen; Google then returns that data in the tokens/userinfo.

- **openid** — Use OpenID Connect so you get an id_token (JWT) with a stable user **id** (`sub`). Needed for “Sign in with Google” identity.
- **email** — Access to the user’s **email** (and email_verified).
- **profile** — Access to basic profile info, including **name** (and picture, etc.).

So the scope is what justifies your app getting **id, email, and name** for the session. `"openid email profile"` is the usual set for “Sign in with Google” and matches the design (user identity: id, email, name).

---

## Implementation details

### Is the default export in auth.google.tsx (the component that returns null) required?

Yes. React Router expects each route file to have a **default export** (the component for that route). Without it, the route module is invalid. For this route, the loader always returns a redirect, so the user never sees the route’s UI. The default export satisfies the framework; the body can stay `return null`.

---

### What is happening in createSession (signed cookie in session.server.ts)?

The code builds a **signed cookie** for the session: the user data lives in the cookie, and a **signature** proves the server created it and that it wasn’t tampered with.

1. **Payload** — The user data (id, email, name) plus an `iat` (issued-at) timestamp is JSON-stringified and base64url-encoded so it can safely go in a cookie.
2. **Signature** — That payload string is signed with **HMAC-SHA256** using `SESSION_SECRET`; only someone with the secret can produce a valid signature for that payload. When the server reads the cookie later, it recomputes the signature and checks it matches (in `getCurrentUser`).
3. **Cookie value** — The value stored in the cookie is `payload.signature` (e.g. `eyJpZCI6...` + `.` + `a1b2c3...`): the encoded data plus the proof it wasn’t tampered with.
4. **Set-Cookie string** — The function returns the full **Set-Cookie** header: cookie name, that value, and attributes (Path, HttpOnly, SameSite=Lax, Max-Age, Secure when HTTPS).

There is no server-side session store: the “session” is the signed blob in the cookie. The server only verifies the signature when it reads the cookie; if the signature is wrong or missing, it treats the user as logged out. That’s the “signed token in an HTTP-only cookie” approach from the design.

---

### What is timingSafeEqual doing?

`timingSafeEqual` is a **constant-time comparison** from Node’s `crypto` module: it compares two buffers so that the time it takes **does not depend on where they first differ**.

**Why a normal comparison leaks information.** With `expected === signature` or a byte-by-byte loop that returns `false` as soon as it finds a mismatch.

**How an attacker can exploit it.** The attacker doesn’t know the real signature (it’s in the cookie and they don’t have the secret), but they can send many requests with _guessed_ cookies and measure how long the server takes to reject them. For the first byte: try 256 possible values; the one that makes the response _slightly slower_ than the others is likely correct (because the comparison had to move past byte 0).

**What timingSafeEqual fixes.** It always compares _every_ byte and never returns early, so the time is (roughly) the same whether the first byte is wrong or only the last. There is no correlation between “which byte is wrong” and response time, so the attacker can’t use timing to learn the signature byte-by-byte.

---

### If the root loader returns the user, how can we get it from for example home?

Use **`useRouteLoaderData("root")`** in any route or component (e.g. home). The root route id is **`"root"`** in React Router’s default route tree.

Example in `app/routes/home.tsx`: `const rootData = useRouteLoaderData("root"); const user = rootData?.user ?? null;` Then branch on `user` (e.g. show “Sign out” and name when set, “Sign in with Google” when null). You can type the root loader return (e.g. shared type or `typeof` from the root loader) so `user` is typed as `{ id, email, name } | null`.
