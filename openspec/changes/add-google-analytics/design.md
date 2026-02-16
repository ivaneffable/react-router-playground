## Context

The app is a React Router 7 (SSR) site deployed on Netlify, with a root layout, client-side navigation, and no existing analytics. We want to add Google Analytics 4 (GA4) to track page views and optionally custom events. The measurement ID must be configurable per environment and must not be committed. The change should not affect auth, blog, or PWA behavior.

## Goals / Non-Goals

**Goals:**

- Load the GA4 gtag.js script when a measurement ID is configured (env var), and only after the user has consented to analytics (see consent goal below).
- Send a page_view hit when the user navigates (initial load and client-side route changes).
- Keep the measurement ID out of source control; support different IDs for local, staging, and production.
- Optionally expose a minimal way to send custom events (e.g. for future use); no specific events required in this change.
- **Cookie consent:** Use [CookieConsent](https://cookieconsent.orestbida.com/) (by Orest Bida) to show a consent banner so users can accept or reject analytics cookies before any GA script runs; load GA only if the user accepts. Aims for compliance with EU ePrivacy/GDPR (and CCPA) expectations for non-essential cookies.

**Non-Goals:**

- Server-side analytics or server-side forwarding of events.
- Historical data migration or integration with other analytics tools.
- Tracking authenticated users differently in this change (GA4 property can be configured separately).

## Decisions

1. **Where to load the script**
   - **Choice:** Inject the gtag script from the root layout (or a component rendered there), so every route gets it without duplicating logic. Use a `<script>` tag in the document head so the script loads once.
   - **Alternatives considered:** Loading from a single route would miss others; loading in a route layout below root would work but root is the natural place for global scripts.
   - **Rationale:** Root layout already wraps the app; one place to read the env and conditionally inject the script.

2. **Environment variable**
   - **Choice:** Use a Vite env var (e.g. `VITE_GA_MEASUREMENT_ID`) so it is available on the client at build time. Document the same var for Netlify (and any other host); leave unset for local dev if no GA property is needed.
   - **Alternatives considered:** Server-only env and passing to client via loader would work but adds complexity; we don’t need the ID on the server for this scope.
   - **Rationale:** GA runs in the browser; Vite’s `import.meta.env.VITE_*` is the standard way to expose config to the client without committing it.

3. **When to send page_view**
   - **Choice:** Use a **single trigger**: whenever the current location changes (including the initial location), send one page_view for that location. Do **not** have separate "on script ready" and "on mount" send paths—that would double-send on first load. Use `window.gtag` with `event: 'page_view'` and a `page_path` (and optionally `page_title`) derived from the current location.
   - **Alternatives considered:** Only on initial load would miss SPA navigations; two triggers (script ready + mount) would double-count the first page.
   - **Rationale:** One effect that depends on location (e.g. `location.pathname` + `location.search` or `location.key`) runs on mount (initial location) and on every navigation. Script readiness is a guard inside that effect (don't call gtag until it's defined), not a separate trigger. Result: exactly one page_view per distinct location view.

4. **How to observe route changes**
   - **Choice:** Use React Router’s `useLocation()` (or equivalent) in a small client component that runs in the root layout. **One effect** with location in the dependency array: when it runs, if measurement ID is set and gtag is ready, send page_view once for the current location. No separate "on mount" vs "on script ready" logic—the effect runs whenever location changes (including the first time), and we send at most once per run.
   - **Alternatives considered:** Subscribing to the router’s navigate events would also work; using `useLocation` keeps the dependency on React Router’s public API and is straightforward.
   - **Rationale:** Single source of truth avoids double-sending on initial load while still capturing every navigation.

5. **Script loading**
   - **Choice:** Load gtag.js asynchronously (e.g. script tag with `async` and `src` pointing to `https://www.googletagmanager.com/gtag/js?id=<MEASUREMENT_ID>`). Initialize `dataLayer` and `gtag` in inline script or a small bootstrap so page_view can be sent once the script is ready.
   - **Alternatives considered:** Synchronous load would block; we don’t need a full npm SDK for this scope.
   - **Rationale:** Standard GA4 setup; async keeps the main thread responsive.

6. **Custom events**
   - **Choice:** Expose a thin helper (e.g. `sendGAEvent(name, params)` or call `window.gtag('event', name, params)` directly) so future features can send events without re-opening this change. No specific events are required in this change.
   - **Rationale:** Proposal allowed optional events; a single documented entry point keeps the contract clear.

7. **Cookie consent implementation**
   - **Choice:** Use [CookieConsent](https://cookieconsent.orestbida.com/) (vanilla JS, by Orest Bida) as the consent management tool. It is lightweight, GDPR/CCPA-oriented, and can block or run scripts based on consent; we use its API to know when the user has accepted or rejected analytics and to persist the choice, then load GA only when accepted.
   - **Alternatives considered:** Custom banner, react-cookie-consent, or other libs; CookieConsent was chosen for its small footprint, accessibility, and built-in compliance features.
   - **Rationale:** Single, well-maintained dependency for consent UI and state; we integrate it so that the GA script is loaded only after the user accepts the relevant category (e.g. analytics).

## Risks / Trade-offs

- **[Risk] Script or measurement ID misconfigured** → Mitigation: Only inject script when measurement ID is present and non-empty; no script in dev if unset. Document env var in README or deployment docs.
- **[Risk] Page views double-counted or missing** → Mitigation: Use a single effect that depends on location; send page_view once per effect run. Do not trigger from both script ready and mount. See Decisions 3 and 4.
- **[Risk] Consent state persistence** → Mitigation: CookieConsent persists the user’s choice (accept/reject) and controls when the banner is shown; we gate GA loading on its consent API so GA runs only when the user has accepted. Respect the choice until the user changes it or clears storage.

## Google Analytics setup

To obtain the measurement ID used by this implementation, set up a GA4 property and stream in Google Analytics. The following steps align with the [Google Analytics for developers](https://developers.google.com/analytics) documentation.

1. **Create or sign in to a Google Analytics account**
   - Go to [Google Analytics](https://analytics.google.com/) and sign in with a Google account.
   - Create an account (or use an existing one) and a **GA4 property** for this site.

2. **Create a web data stream**
   - In the GA4 property, go to **Admin** → **Data streams** → **Add stream** → **Web**.
   - Enter the site URL (e.g. your production origin and optionally the dev origin for testing).
   - Create the stream. Google shows a **Measurement ID** in the form `G-XXXXXXXXXX`. This is the value used as `VITE_GA_MEASUREMENT_ID` in the app.

3. **Use the measurement ID in the app**
   - Put the Measurement ID in the app's environment (e.g. `VITE_GA_MEASUREMENT_ID` in `.env` locally and in Netlify's environment variables for production). Never commit it to the repo.
   - The app loads the gtag.js script with this ID (after consent, per this design) and sends page_view and optional events to that property.

**Reference:** [Google Analytics for developers](https://developers.google.com/analytics) — overview, tagging (gtag.js), events, and GA4 setup. The "Analytics for developers" path covers setting up a website or app, events, and custom measurement.

## Migration Plan

1. **Config:** Add `VITE_GA_MEASUREMENT_ID` to Netlify (and optionally to local `.env`) with the GA4 measurement ID. Leave unset for environments where we don’t want tracking.
2. **Deploy:** Ship the script injection and page-view logic; verify in GA4 debug view or real-time report that hits appear on navigation.
3. **Rollback:** Remove or unset the env var and redeploy; no data migration. Existing GA4 data remains in the property.

## Open Questions

- None for this change. Consent and event taxonomy can be decided in later iterations.
