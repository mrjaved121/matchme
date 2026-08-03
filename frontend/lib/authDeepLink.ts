import { supabase } from "./supabase";

/** Supabase's default (non-customizable) magic-link email only offers a
 * tap-able "Sign in" link, not a typeable code — since editing that
 * template requires custom SMTP or a paid plan we're avoiding for now.
 * This parses the tokens out of that link's redirect (matchme://auth-callback#access_token=...)
 * and establishes the session directly, so tapping the email link signs
 * the user in without ever needing the code-entry screen. */
export async function handleAuthDeepLink(url: string | null): Promise<boolean> {
  if (!url) return false;

  const hashIndex = url.indexOf("#");
  const queryIndex = url.indexOf("?");
  const paramsString = hashIndex >= 0 ? url.slice(hashIndex + 1) : queryIndex >= 0 ? url.slice(queryIndex + 1) : "";
  if (!paramsString) return false;

  const params = new URLSearchParams(paramsString);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return false;

  const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  return !error;
}
