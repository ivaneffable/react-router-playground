const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
}

interface TokenResponse {
  access_token: string;
  id_token: string; // Always present when 'openid' scope is requested
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Exchange authorization code for tokens, then decode the id_token to get user info.
 * Returns user info or throws on failure.
 */
export async function exchangeCodeForUser(
  code: string,
  redirectUri: string,
): Promise<GoogleUser> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured");
  }

  // Exchange code for tokens
  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(
      `Token exchange failed: ${tokenResponse.status} ${errorText}`,
    );
  }

  const tokens: TokenResponse = await tokenResponse.json();

  // Decode user from id_token (always present with 'openid' scope)
  return decodeIdToken(tokens.id_token);
}

/**
 * Decode JWT id_token without verification (Google already signed it).
 * Throws if the token is malformed or missing required claims.
 */
function decodeIdToken(idToken: string): GoogleUser {
  const [, payloadB64] = idToken.split(".");
  if (!payloadB64) {
    throw new Error("Invalid id_token: missing payload");
  }

  // Base64url decode
  const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf8");
  const payload = JSON.parse(payloadJson);

  if (!payload.sub || !payload.email) {
    throw new Error("Invalid id_token: missing sub or email claim");
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
  };
}
