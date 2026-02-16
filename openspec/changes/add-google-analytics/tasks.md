## 1. Cookie consent (CookieConsent)

- [x] 1.1 Add [CookieConsent](https://cookieconsent.orestbida.com/) (Orest Bida) and configure it with an analytics category; use its API to read consent state (accept/reject) and persist the choice
- [x] 1.2 Render or initialize the CookieConsent banner from root layout so it appears when no stored choice exists; ensure accept/reject actions are available
- [x] 1.3 Wire CookieConsent callbacks so that when the user accepts analytics, the app loads GA (e.g. state update or re-check that gates script injection); when the user rejects, GA is not loaded

## 2. Environment and script loading

- [x] 2.1 Document `VITE_GA_MEASUREMENT_ID` in README or deployment docs; add to `.env.example` without a value
- [x] 2.2 In root layout, inject gtag.js only when `VITE_GA_MEASUREMENT_ID` is set and user has consented; load script async and initialize dataLayer/gtag

## 3. Page view tracking

- [x] 3.1 Add a client component that uses `useLocation()` with one effect (location in deps); when effect runs, if measurement ID set and gtag ready and consented, send one page_view with `page_path` (and optionally `page_title`) from current location
- [x] 3.2 Mount the page-view component from root layout so it runs for all routes and captures initial load and navigations

## 4. Custom events

- [x] 4.1 Expose a helper (e.g. `sendGAEvent(name, params)`) that no-ops when GA is not loaded or user has not consented, otherwise calls `window.gtag('event', name, params)`
