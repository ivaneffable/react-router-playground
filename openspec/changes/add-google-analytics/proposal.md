## Why

We want to understand how visitors use the site—which pages they view, how they navigate, and optionally how they interact with key actions. Adding Google Analytics (GA4) gives us that visibility without changing the app’s core behavior, and enables future decisions based on real usage data.

## What Changes

- Add a Google Analytics 4 (GA4) measurement script to the app, loaded client-side when a measurement ID is configured.
- Track page views on navigation (e.g. route changes in the React Router app).
- Measurement ID supplied via environment variable (e.g. `VITE_GA_MEASUREMENT_ID` or similar) so it can differ per environment and stay out of source control.
- Optionally support sending custom events (e.g. outbound link clicks, button clicks) for later use; scope kept minimal in this change.

## Capabilities

### New Capabilities

- `google-analytics`: Load the GA4 script when a measurement ID is configured; send page view hits on route/navigation; optionally send custom events. Covers configuration (env), script injection, and the contract for what the app must send (page views) and may send (events).

### Modified Capabilities

- (none)

## Impact

- **Root layout or document head:** Script tag or loader that injects the gtag snippet when the measurement ID is present. No change to auth, blog, or PWA behavior.
- **Client bundle:** Small addition for gtag initialization and any page-view or event helpers. Script can be loaded asynchronously to avoid blocking render.
- **Environment:** New env var (e.g. `VITE_GA_MEASUREMENT_ID`) for local and production; document for Netlify or other hosts.
- **Dependencies:** No new npm dependencies required if using the standard gtag.js snippet; optional lightweight wrapper or type definitions if we add a small helper module.
