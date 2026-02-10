import { redirect, type LoaderFunctionArgs } from "react-router";
import { clearSession } from "~/lib/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // 5.1 - Clear the session cookie
  const clearCookieHeader = clearSession(request);
  // 5.2 - Redirect to home
  return redirect("/", {
    headers: { "Set-Cookie": clearCookieHeader },
  });
}

export default function AuthLogout() {
  return null;
}
