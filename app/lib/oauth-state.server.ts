import { randomBytes } from "node:crypto";

// The OAuth "state" cookie is used as a CSRF protection mechanism.
// It ensures that the OAuth redirect after authentication comes from a legitimate interaction
// initiated by the user of this browser, not a malicious third party. We generate a random
// state value for each auth attempt, store it in a secure, short-lived cookie, and verify
// it on callback. If the state does not match, the authentication attempt is rejected.

const STATE_COOKIE = "oauth_state";
const STATE_MAX_AGE_SEC = 60 * 10; // 10 minutes

function isSecure(request: Request): boolean {
  const url = new URL(request.url);
  return url.protocol === "https:";
}

/**
 * Generate a random state and return [state, Set-Cookie header].
 */
export function createStateCookie(request: Request): [string, string] {
  const state = randomBytes(32).toString("hex");
  const secure = isSecure(request) ? "; Secure" : "";
  const cookie = `${STATE_COOKIE}=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${STATE_MAX_AGE_SEC}${secure}`;
  return [state, cookie];
}

/**
 * Read state from cookie. Returns null if not found.
 */
export function getStateFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${STATE_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

/**
 * Clear state cookie. Returns Set-Cookie header.
 */
export function clearStateCookie(request: Request): string {
  const secure = isSecure(request) ? "; Secure" : "";
  return `${STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
