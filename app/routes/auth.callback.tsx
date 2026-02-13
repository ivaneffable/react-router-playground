import { redirect, type LoaderFunctionArgs } from "react-router";
import { getStateFromCookie, clearStateCookie } from "~/lib/oauth-state.server";
import { exchangeCodeForUser } from "~/lib/google-oauth.server";
import { createSession } from "~/lib/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateFromUrl = url.searchParams.get("state");

  // 4.2 - Validate state against value stored in cookie
  const storedState = getStateFromCookie(request);
  if (!stateFromUrl || !storedState || stateFromUrl !== storedState) {
    // State missing or mismatch: redirect home without exchanging code
    return redirect("/", {
      headers: { "Set-Cookie": clearStateCookie(request) },
    });
  }

  // Clear state cookie now that it's validated
  const clearStateHeader = clearStateCookie(request);

  // 4.3 - Exchange code for tokens and obtain user identity
  if (!code) {
    // No code provided (user may have denied consent)
    return redirect("/", {
      headers: { "Set-Cookie": clearStateHeader },
    });
  }

  const redirectUri = `${url.origin}/auth/callback`;

  try {
    const user = await exchangeCodeForUser(code, redirectUri);

    // 4.4 - On success: create session and redirect to home
    const sessionCookie = createSession(
      { id: user.id, email: user.email, name: user.name },
      request,
    );
    const headers = new Headers();
    headers.append("Set-Cookie", clearStateHeader);
    headers.append("Set-Cookie", sessionCookie);
    return redirect("/", { headers });
  } catch {
    // 4.5 - On failure: redirect to safe page, do not set session
    return redirect("/", {
      headers: { "Set-Cookie": clearStateHeader },
    });
  }
}

export default function AuthCallback() {
  return null;
}
