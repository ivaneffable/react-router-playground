# FAQ: add-google-analytics

### Why do we need the stub `gtag` function when we load the real gtag.js script?

The real gtag.js script is loaded **asynchronously** (`script.async = true`), so it may take a while to download and run. Until it runs, there is no real `gtag` from Google.

We need the stub for two reasons:

1. **Queue initial commands** — We call `gtag("js", new Date())` and `gtag("config", measurementId)` immediately after defining the stub. Those must run before the real script loads. The stub pushes those calls into `dataLayer`. When the real gtag.js loads, it reads `dataLayer`, runs the queued commands, then replaces `window.gtag` so future calls use the real implementation. So the stub is the standard GA pattern for queueing commands before the script is ready.

2. **`window.gtag` exists from the start** — Other code (e.g. GoogleAnalyticsPageView or sendGAEvent) may call `window.gtag(...)` before the script has loaded. Without the stub, `window.gtag` would be undefined and those calls would throw or need extra guards. With the stub, every call is pushed to `dataLayer` and will be processed when the real script loads.

So the stub is not redundant: it lets us run the initial config right away and lets any caller safely use `gtag` before the real script has loaded.
