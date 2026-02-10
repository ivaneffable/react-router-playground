import { redirect, type LoaderFunctionArgs } from "react-router";
import { createStateCookie } from "~/lib/oauth-state.server";

const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPE = "openid email profile";

export async function loader({ request }: LoaderFunctionArgs) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Response("GOOGLE_CLIENT_ID is not configured", { status: 500 });
  }

  const url = new URL(request.url);
  const redirectUri = `${url.origin}/auth/callback`;

  // 3.2 - Generate state and store in cookie
  const [state, stateCookie] = createStateCookie(request);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    state,
  });

  // 3.3 - Redirect to Google's authorization endpoint
  const authUrl = `${GOOGLE_AUTH_BASE}?${params.toString()}`;
  return redirect(authUrl, {
    headers: { "Set-Cookie": stateCookie },
  });
}

export default function AuthGoogle() {
  return null;
}
