## ADDED Requirements

### Requirement: Sentiment analysis UI on home page

The system SHALL provide a sentiment analysis feature on the home page. The system MUST display a textarea for the user to enter a short sentence, a button to trigger analysis (e.g. "Analyse sentiment"), and an area to display the sentiment result. The system SHALL use Chrome's built-in AI (Prompt API with Gemini Nano) to analyse the text on-device; no text SHALL be sent to a server for sentiment analysis.

#### Scenario: User enters text and triggers analysis

- **WHEN** the user has entered text in the textarea and clicks the analyse button
- **THEN** the system MUST call the built-in AI (e.g. Prompt API) with a prompt that asks for the sentiment of the given text
- **AND** the system MUST display the result in the designated result area (as a normalized label: positive, negative, or neutral)

#### Scenario: Sentiment block is present on home page

- **WHEN** the user visits the home page
- **THEN** the system MUST show the textarea, button, and result area (or a clear message if the feature is not available in the current browser)

### Requirement: Built-in AI usage and availability

The system SHALL use the Prompt API (or equivalent language-model API) with Gemini Nano. The system MUST check the API's `availability()` (with `languages: ["en"]` if required) before creating a session. The system MUST require user activation (e.g. the button click) before calling `create()` when the model is downloadable. The system SHALL handle the availability states "unavailable", "downloadable", "downloading", and "available" and SHALL reflect them in the UI (e.g. disabled button, "Downloading model…", or unsupported message).

#### Scenario: Model available or downloadable and user clicks button

- **WHEN** `availability()` returns "available" or "downloadable" and the user clicks the analyse button (user activation)
- **THEN** the system MUST create a session and send the sentiment prompt with the user's text
- **AND** the system MUST display the resulting sentiment as a normalized label

#### Scenario: Model unavailable

- **WHEN** `availability()` returns "unavailable" or the Prompt API is not present
- **THEN** the system MUST NOT call `create()` or send the prompt
- **AND** the system MUST show a clear message that sentiment analysis is not supported in this browser or device

#### Scenario: Model downloading

- **WHEN** `availability()` returns "downloading"
- **THEN** the system MUST show a "Downloading model…" (or equivalent) state to the user
- **AND** the system MAY poll or re-check availability until the model is ready or remains unavailable

### Requirement: Normalized sentiment labels

The system SHALL display sentiment using only a fixed set of normalized labels (e.g. positive, negative, neutral). The system MUST map the model's free-form reply to one of these labels for display. The system MUST NOT show the raw model response to the user.

#### Scenario: Result displayed as normalized label

- **WHEN** the model returns a response after the user triggers analysis
- **THEN** the system MUST map the response to one of the allowed labels (e.g. positive, negative, neutral)
- **AND** the system MUST display only that label in the result area

### Requirement: Indicator when model is already downloaded

The system SHALL check `availability()` when the sentiment block is visible (e.g. on load). When the result is "available", the system MUST show a visible indicator to the user (e.g. "Sentiment analysis ready", a badge, or an icon) so they know the model is downloaded and the feature will work immediately. When the result is "downloadable" or "downloading", the system MUST show a different state (e.g. "Click to enable" or "Downloading model…"). When "unavailable", the system MUST NOT show a "ready" indicator.

#### Scenario: Model already downloaded

- **WHEN** `availability()` returns "available"
- **THEN** the system MUST show an indicator that sentiment analysis is ready (e.g. "Sentiment analysis ready")
- **AND** the analyse button MUST be enabled for use without further download

#### Scenario: Model not yet ready

- **WHEN** `availability()` returns "downloadable", "downloading", or "unavailable"
- **THEN** the system MUST NOT show the "ready" indicator
- **AND** the system MUST show the appropriate state (e.g. "Click to enable", "Downloading model…", or unsupported message)

### Requirement: In-app guidance for Chrome flags

When the feature is used in an environment where end users may need to enable Chrome flags for the built-in AI to work (e.g. production or a build where the API is off by default), the system MUST show in-app guidance (steps or link to enable the required flags, e.g. `chrome://flags/#optimization-guide-on-device-model` and `chrome://flags/#prompt-api-for-gemini-nano`). When flags are only required for localhost or developer use, the system MUST NOT show this guidance in the app; guidance SHALL be documented in README or dev docs instead.

#### Scenario: Flags needed in user environment

- **WHEN** the feature is in an environment where end users may need to enable Chrome flags (e.g. production)
- **THEN** the system MUST provide in-app guidance so the user can enable the required flags
- **AND** the guidance MUST be visible when the feature is unavailable or when the user seeks help

#### Scenario: Flags only for localhost

- **WHEN** flags are only required for localhost/developer use
- **THEN** the system MUST NOT show in-app guidance for enabling flags
- **AND** the requirement to enable flags SHALL be documented in README or developer documentation

### Requirement: Graceful degradation

When the Prompt API (or equivalent) is not present (e.g. not in `window` or not a function) or when `availability()` returns "unavailable", the system MUST show a short message that sentiment analysis is only available in supported Chrome environments. The system MUST NOT break the home page; the rest of the page SHALL remain usable.

#### Scenario: API not supported

- **WHEN** the Prompt API is not present or `availability()` returns "unavailable"
- **THEN** the system MUST show a message that the feature is only available in supported Chrome environments
- **AND** the home page MUST remain functional (e.g. other content and navigation work)

### Requirement: English only

The system SHALL support English only for this change. The system MUST call `availability()` with `languages: ["en"]` if the API requires it. The prompt and UI copy for the sentiment feature SHALL be in English. Non-English input is not explicitly supported.

#### Scenario: English language declared

- **WHEN** the system checks availability for the Prompt API
- **THEN** the system MUST pass `languages: ["en"]` to `availability()` if the API requires a language declaration
- **AND** the sentiment prompt and result UI MUST be in English
