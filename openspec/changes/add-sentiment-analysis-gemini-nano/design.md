## Context

The app is a React Router 7 (SSR) site with a home page at the index route (`routes/home.tsx`). We want to add sentiment analysis for micro-journaling: the customer types a short sentence, clicks a button, and sees the sentiment (e.g. positive, negative, neutral) without sending data to a server. Chrome’s built-in AI (Gemini Nano) is used via the **Prompt API** (or equivalent language-model API) so the model runs on-device. This only works in Chrome on supported desktops (Windows 10/11, macOS 13+, Linux, ChromeOS on Chromebook Plus); it requires model download, sufficient storage/GPU/CPU, and user activation before creating a session. Reference: [Get started with built-in AI](https://developer.chrome.com/docs/ai/get-started).

## Goals / Non-Goals

**Goals:**

- Add a textarea and a “Analyse sentiment” (or similar) button on the home page.
- When the customer has entered text and clicks the button, call the built-in AI (e.g. Prompt API with Gemini Nano) with a fixed prompt that asks for the sentiment of the given text; display the result in the UI (e.g. a label or short phrase).
- Respect Chrome’s requirements: check `availability()` before use; require user activation (e.g. the button click) before calling `create()` when the model is downloadable; handle “unavailable”, “downloadable”, “downloading”, and “available” states in the UI (e.g. disable button or show a message when unavailable).
- Show an **indicator** when the model is already downloaded (when `availability()` returns `"available"`), so the user knows the feature is ready without clicking first (e.g. “Sentiment analysis ready” or a small status badge).
- In-app guidance for enabling Chrome flags (e.g. how to turn on the required flags) **must** be shown to the user when those flags are needed in their environment. If flags are only required on localhost (developer setup), no in-app guidance is needed for end users—document in README instead.

**Non-Goals:**

- Supporting non-Chrome browsers for this feature (graceful degradation is in scope; full feature parity is not).
- Storing or persisting journal entries or sentiment history in this change.

## Decisions

1. **Which API to use**
   - **Choice:** Use the **Prompt API** (language model session with Gemini Nano) to send a single prompt: “What is the sentiment of this text: \<user text\>? Reply with one short word or phrase (e.g. positive, negative, neutral).”
   - **Alternatives considered:** Summarizer or other built-in APIs are for different tasks; the Prompt API is the right fit for a free-form sentiment prompt.
   - **Rationale:** Matches Chrome’s built-in AI model and keeps logic simple (one prompt, one response).

2. **Where the UI lives**
   - **Choice:** Add the textarea, button, and result area in the existing home page component (`routes/home.tsx`). Use a client component or `useEffect` + state for the interaction and API calls, so the route stays the default export and the page remains server-renderable with client-side enhancement.
   - **Rationale:** Proposal scopes the feature to the home page; no new route or layout needed.

3. **User activation and availability**
   - **Choice:** The “Analyse sentiment” button is the user gesture. On click: check `availability()` (with any required options, e.g. `languages: ["en"]` if the API requires it). If status is `"downloadable"` or `"available"`, call `create()` (user activation from the click satisfies Chrome’s requirement). If `"downloading"`, show a “Downloading model…” state and optionally poll or re-check. If `"unavailable"`, show a clear message (e.g. “Sentiment analysis is not supported in this browser or device”) and do not call the API.
   - **Rationale:** Aligns with [Chrome’s requirements](https://developer.chrome.com/docs/ai/get-started): user activation for starting a session when the model may need to download; availability check avoids errors and informs the user.

4. **Prompt and response shape**
   - **Choice:** Single turn: prompt = “What is the sentiment of the following text? Reply with only one short word or phrase (e.g. positive, negative, neutral, mixed). Text: \<escaped user input\>.” Use **only a fixed set of normalized labels** (e.g. positive, negative, neutral): map the model’s free-form reply to one of these labels for display; do not show the raw model response. No structured output required for this change unless the API supports it later.
   - **Rationale:** Consistent UI and predictable UX; avoids odd phrasing from the model.

5. **Graceful degradation**
   - **Choice:** If the Prompt API (or equivalent) is not present (e.g. not in `window` or not a function), or `availability()` returns `"unavailable"`, show a short message that sentiment analysis is only available in supported Chrome environments. Do not break the page.
   - **Rationale:** Many users may be on unsupported browsers or devices; the home page must still work.

6. **When to show “how to enable” guidance**
   - **Choice:** Show in-app guidance (steps or link to enable Chrome flags, e.g. `chrome://flags/#optimization-guide-on-device-model` and `chrome://flags/#prompt-api-for-gemini-nano`) **only when** the feature is used in an environment where end users may need to enable those flags (e.g. production or a build where the API is off by default). If flags are only needed for localhost/developer use, do **not** show this guidance in the app; document it in README or dev docs instead.
   - **Rationale:** End users on production should see clear instructions when the feature requires them to change settings; developers on localhost can follow README without cluttering the UI.

7. **Indicator when model is already downloaded**
   - **Choice:** After checking `availability()` (e.g. on load or when the sentiment block is visible), if the result is `"available"`, show a visible indicator to the user (e.g. “Sentiment analysis ready”, a small badge, or an icon) so they know the model is downloaded and the button will work immediately. For `"downloadable"` or `"downloading"` show a different state (e.g. “Click to enable” or “Downloading model…”); for `"unavailable"` show the unsupported message and no “ready” indicator.
   - **Rationale:** Users benefit from knowing up front that the feature is ready without having to click first; it also clarifies when a one-time download has already completed.

8. **Language support**
   - **Choice:** For the moment **English only**: call `availability()` with `languages: ["en"]` if the API requires it; prompt and UI copy in English. Non-English input is not explicitly supported in this change.
   - **Rationale:** Matches current Gemini Nano language support and keeps scope small; other languages can be added later.

## Risks / Trade-offs

- **[Risk] Model not available (unavailable / downloading)** → Mitigation: Check `availability()` and surface state in the UI (disabled button, “Downloading…”, or “Not supported” message). Do not call `create()` when unavailable.
- **[Risk] User enables flags but model fails to download (storage, network, device)** → Mitigation: Rely on `availability()` and show the “unavailable” or “downloadable”/“downloading” state; optionally link to Chrome’s troubleshooting (e.g. `chrome://on-device-internals`, restart).
- **[Risk] Prompt API or options change in future Chrome versions** → Mitigation: Pin the implementation to the current API shape; document the Chrome version or origin-trial status if applicable; handle missing APIs defensively.
- **[Trade-off] Chrome-only** → Acceptable for this change; we document or message that the feature is for supported Chrome only and degrade gracefully elsewhere.

## Migration Plan

1. **Implement** the home page UI (textarea, button, result area) and the client-side logic that checks availability, creates a session on button click, sends the sentiment prompt, and displays the result (or an error/unsupported message).
2. **Test** in Chrome with the relevant flags enabled (localhost) and with a GA/stable Chrome build where the API is available; verify “unavailable” and “downloading” states.
3. **Document** in README or in-app: that sentiment analysis uses Chrome’s built-in AI; link to [Chrome built-in AI get started](https://developer.chrome.com/docs/ai/get-started) and mention flags for localhost if needed.
4. **Rollback:** Remove the new UI and API usage from the home page; no data migration.

## Open Questions

- None for this change.
