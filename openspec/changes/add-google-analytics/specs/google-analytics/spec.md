## ADDED Requirements

### Requirement: Analytics configuration and script loading

The system SHALL load the Google Analytics 4 (GA4) gtag.js script only when a measurement ID is configured (e.g. via a client-visible environment variable such as `VITE_GA_MEASUREMENT_ID`) and only after the user has consented to analytics. The measurement ID MUST NOT be committed to source control. When the ID is missing or empty, the system MUST NOT inject the GA script or send any hits.

#### Scenario: Measurement ID configured and user consented

- **WHEN** the measurement ID is set (e.g. `VITE_GA_MEASUREMENT_ID`) and the user has accepted analytics (e.g. via the consent banner)
- **THEN** the system MUST inject the gtag.js script (e.g. from the root layout) with the configured measurement ID
- **AND** the script MUST be loaded asynchronously so it does not block initial render

#### Scenario: Measurement ID not configured

- **WHEN** the measurement ID is not set or is empty (e.g. in local dev or when unset in the host environment)
- **THEN** the system MUST NOT inject the GA script
- **AND** the system MUST NOT send any page_view or custom events

#### Scenario: User has not consented

- **WHEN** the user has not yet accepted analytics (or has rejected it) in the consent banner
- **THEN** the system MUST NOT load the GA script or send any hits until the user accepts

### Requirement: Cookie consent (CookieConsent)

The system SHALL use [CookieConsent](https://cookieconsent.orestbida.com/) (by Orest Bida) for consent management. The system SHALL show the CookieConsent banner so the user can accept or reject analytics cookies before any GA script runs. The system SHALL load GA only if the user accepts (via CookieConsent’s API). The system SHALL rely on CookieConsent to persist the user’s choice so the banner is not shown on every visit and the app knows whether to load GA on subsequent requests.

#### Scenario: User accepts analytics

- **WHEN** the user accepts analytics (e.g. via the CookieConsent banner or accept action)
- **THEN** the system MUST record the acceptance via CookieConsent (which persists the choice)
- **AND** the system MAY load the GA script and send page_view and events for that and subsequent sessions until the user changes preference

#### Scenario: User rejects analytics

- **WHEN** the user rejects analytics (e.g. via the CookieConsent banner or reject/necessary-only action)
- **THEN** the system MUST record the rejection via CookieConsent
- **AND** the system MUST NOT load the GA script or send any hits

#### Scenario: Consent state persisted

- **WHEN** the user has previously accepted or rejected analytics and CookieConsent has stored the choice
- **THEN** the system MUST respect that choice (load GA only if accepted) without requiring the user to see the banner again on every visit, until the user clears storage or changes preference

### Requirement: Page view tracking

The system SHALL send exactly one page_view hit to GA for each distinct location view: on initial load (for the first location) and on each client-side navigation. The system MUST use a single trigger (e.g. one effect that depends on the current location); it MUST NOT send page_view from both "script ready" and "mount" separately, so the first page is not double-counted. The hit MUST include `page_path` (and optionally `page_title`) derived from the current location (e.g. from React Router's location).

#### Scenario: Initial load sends one page_view

- **WHEN** the user loads the app (or the first route is shown) and GA is loaded and consented
- **THEN** the system MUST send exactly one page_view hit with `page_path` (and optionally `page_title`) for that location
- **AND** the system MUST NOT send a second page_view for the same location due to a separate "script ready" or "mount" trigger

#### Scenario: Navigation sends one page_view per location

- **WHEN** the user navigates to a new route (client-side) and GA is loaded
- **THEN** the system MUST send exactly one page_view hit for the new location with `page_path` (and optionally `page_title`) derived from the current location
- **AND** each distinct location view MUST result in exactly one page_view

#### Scenario: No page_view when GA not loaded or not consented

- **WHEN** the user has not consented or the GA script is not yet loaded
- **THEN** the system MUST NOT send page_view for the current or any location until consent is given and the script is ready

### Requirement: Optional custom events

The system SHALL expose a minimal way for the application to send custom events to GA (e.g. a helper that calls `window.gtag('event', name, params)` or equivalent). No specific events are required in this change; the capability allows future features to send events without re-opening the analytics change.

#### Scenario: Custom event sent when GA is loaded and consented

- **WHEN** the application calls the exposed event helper (e.g. `sendGAEvent(name, params)`) and GA is loaded and the user has consented
- **THEN** the system MUST send the event to GA with the given name and parameters
- **AND** the event MUST appear in the GA property (e.g. in debug view or reports) when configured

#### Scenario: Custom event not sent when GA not loaded or not consented

- **WHEN** the application calls the event helper but the user has not consented or the GA script is not loaded
- **THEN** the system MUST NOT send the event to GA (or MUST no-op) so that no analytics data is sent without consent
