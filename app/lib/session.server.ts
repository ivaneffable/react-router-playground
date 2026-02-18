import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

type SessionUser = {
  id: string;
  email: string;
  name: string;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET must be set and at least 16 characters (for signing)",
    );
  }
  return secret;
}

function isSecure(request: Request): boolean {
  const url = new URL(request.url);
  return url.protocol === "https:";
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data, "utf8").toString("base64url");
}

function base64UrlDecode(data: string): string {
  return Buffer.from(data, "base64url").toString("utf8");
}

// Sign the payload using HMAC-SHA256 with the given secret and return a base64url-encoded signature
function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function verifySignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = sign(payload, secret);
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/**
 * Create a session for the user. Returns the Set-Cookie header value.
 */
export function createSession(user: SessionUser, request: Request): string {
  const secret = getSecret();
  const payload = base64UrlEncode(
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
    }),
  );
  const signature = sign(payload, secret);
  const value = `${payload}.${signature}`;
  const secure = isSecure(request) ? "; Secure" : "";
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SEC}${secure}`;
}

/**
 * Read and verify session from request. Returns user or null.
 */
export function getCurrentUser(request: Request): SessionUser | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  const value = match?.[1];
  if (!value) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  try {
    const secret = getSecret();
    if (!verifySignature(payload, signature, secret)) return null;

    const decoded = JSON.parse(base64UrlDecode(payload));
    if (!decoded?.id || !decoded?.email) return null;

    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name ?? decoded.email,
    };
  } catch {
    return null;
  }
}

/**
 * Clear the session cookie. Returns the Set-Cookie header value.
 */
export function clearSession(request: Request): string {
  const secure = isSecure(request) ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
