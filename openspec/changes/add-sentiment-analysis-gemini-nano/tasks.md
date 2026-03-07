## 1. Home page sentiment UI

- [x] 1.1 Add a sentiment block to the home page (textarea, "Analyse sentiment" button, and result area) in `routes/home.tsx` (or a client component used by it)
- [x] 1.2 When the Prompt API is not present or `availability()` returns "unavailable", show a short message that sentiment analysis is only available in supported Chrome environments; keep the rest of the home page usable

## 2. Availability check and model status indicator

- [x] 2.1 Call the Prompt API `availability()` with `languages: ["en"]` when the sentiment block is visible (e.g. on load); handle "unavailable", "downloadable", "downloading", and "available"
- [x] 2.2 When status is "available", show a visible indicator (e.g. "Sentiment analysis ready" or badge); when "downloadable" or "downloading", show "Click to enable" or "Downloading model…"; when "unavailable", show unsupported message and no ready indicator
- [x] 2.3 Enable or disable the analyse button and show appropriate state for each availability value (e.g. disabled or "Downloading…" when not ready)

## 3. Prompt API session and sentiment request

- [x] 3.1 On "Analyse sentiment" button click (user activation), if status is "available" or "downloadable", call `create()` to start a session
- [x] 3.2 Send a single prompt with the user's text (e.g. "What is the sentiment of the following text? Reply with only one short word or phrase (e.g. positive, negative, neutral, mixed). Text: <escaped user input>.")
- [x] 3.3 Read the model response and pass it to the normalization step; display the normalized label in the result area (or show an error state if the request fails)

## 4. Normalized sentiment labels

- [x] 4.1 Implement mapping from the model's free-form reply to a fixed set of labels (e.g. positive, negative, neutral); do not display the raw model response
- [x] 4.2 Handle edge cases (empty response, unknown words) by defaulting to a safe label or "neutral"

## 5. In-app guidance for Chrome flags

- [ ] 5.1 When the feature is used in an environment where end users may need to enable Chrome flags (e.g. production), show in-app guidance (steps or link to `chrome://flags/#optimization-guide-on-device-model` and `chrome://flags/#prompt-api-for-gemini-nano`)
- [ ] 5.2 When flags are only required for localhost, do not show in-app guidance; document how to enable flags for local dev in README

## 6. Documentation

- [ ] 6.1 Document in README that sentiment analysis uses Chrome's built-in AI (Gemini Nano), link to [Chrome built-in AI get started](https://developer.chrome.com/docs/ai/get-started), and mention enabling flags for localhost if applicable
