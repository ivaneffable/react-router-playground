/**
 * Sends a custom event to Google Analytics. No-ops when GA is not loaded
 * (e.g. no measurement ID or user has not consented).
 */
export function sendGAEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function")
    return;
  window.gtag("event", name, params ?? {});
}
