## Why

The customer is micro-journaling and we want to analyse the sentiment of a short sentence they write. This gives them quick feedback on the emotional tone of their entry without leaving the app or sending data to a server.

## What Changes

- On the home page, add a textarea and a button.
- When the customer has entered some text and clicks the button, the text is analysed by Gemini Nano in the browser (Chrome built-in AI).
- Sentiment result is shown to the customer (e.g. positive, negative, neutral, or a short label).

## Capabilities

### New Capabilities

- `sentiment-analysis`: Analyse the sentiment of a short sentence that the customer enters on the home page, using Gemini Nano in the browser. The customer triggers analysis with a button; the result is displayed in the UI. Covers the Prompt API (or equivalent) usage, user activation, and handling of model availability (e.g. downloadable, unavailable).

### Modified Capabilities

- (none)

## Impact

- **Home page:** New UI (textarea, button, and area to show sentiment result). No change to auth, blog, PWA, or analytics behavior.
- **Client bundle:** Code that uses Chrome’s built-in AI (e.g. Prompt API / Gemini Nano) for a single prompt (sentiment of the entered text). Runs only in supported Chrome environments.
- **Browser / customer:** We need to investigate what the customer must do for Gemini Nano to work in their Chrome (e.g. enabling flags such as `chrome://flags/#optimization-guide-on-device-model` and `chrome://flags/#prompt-api-for-gemini-nano`, user activation before calling the API, and any permissions or prompts). Documentation or in-app guidance may be needed so customers know how to enable or use the feature when it’s not available by default.
