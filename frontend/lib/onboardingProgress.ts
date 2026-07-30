import { supabase } from "./supabase";

/** Route to send a signed-in, not-yet-onboarded user to, based on how far
 * they already got — so closing the app mid-signup doesn't lose progress. */
export async function resolveOnboardingStep(userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, birthdate, gender, interested_in, looking_for, bio")
    .eq("id", userId)
    .single();

  if (!profile?.first_name) return "/onboarding/name";
  if (!profile?.birthdate) return "/onboarding/birthdate";
  if (!profile?.gender) return "/onboarding/gender";
  if (!profile?.interested_in?.length || !profile?.looking_for) return "/onboarding/preferences";

  const { count: photoCount } = await supabase
    .from("profile_photos")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", userId);
  if (!photoCount) return "/onboarding/photos";

  if (!profile?.bio || profile.bio.trim().length < 10) return "/onboarding/bio";

  return "/onboarding/guidelines";
}
