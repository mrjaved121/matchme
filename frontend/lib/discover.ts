import * as Location from "expo-location";
import { supabase } from "./supabase";

export type DiscoverCandidate = {
  id: string;
  first_name: string | null;
  bio: string;
  birthdate: string | null;
  city: string | null;
  job_title: string | null;
  interest_tags: string[];
  is_verified: boolean;
  latitude: number | null;
  longitude: number | null;
};

export async function fetchDiscoverCandidates(limit = 15): Promise<DiscoverCandidate[]> {
  const { data, error } = await supabase.rpc("discover_candidates", { p_limit: limit });
  if (error) throw error;
  return data ?? [];
}

export type SwipeAction = "like" | "pass" | "superlike";

export async function recordSwipe(swipedId: string, action: SwipeAction) {
  const { data, error } = await supabase
    .rpc("record_swipe", { p_swiped_id: swipedId, p_action: action })
    .single();
  if (error) throw error;
  return data as { matched: boolean; match_id: string | null };
}

/** Best-effort: silently no-ops if permission is denied, since distance
 * filtering already degrades gracefully when a profile has no coordinates. */
export async function captureAndSaveLocation(userId: string): Promise<void> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    await supabase
      .from("profiles")
      .update({ latitude: position.coords.latitude, longitude: position.coords.longitude })
      .eq("id", userId);
  } catch {
    // Location unavailable (simulator, permissions, etc.) — fine to skip.
  }
}

export type Liker = { id: string; first_name: string | null; photoPath: string | null };

export async function fetchWhoLikedMe(myId: string): Promise<Liker[]> {
  const { data: likes } = await supabase
    .from("swipes")
    .select("swiper_id")
    .eq("swiped_id", myId)
    .in("action", ["like", "superlike"]);

  const likerIds = [...new Set((likes ?? []).map((l) => l.swiper_id))];
  if (likerIds.length === 0) return [];

  const { data: existingMatches } = await supabase
    .from("matches")
    .select("user_a_id, user_b_id")
    .eq("status", "active")
    .or(`user_a_id.eq.${myId},user_b_id.eq.${myId}`);

  const matchedIds = new Set(
    (existingMatches ?? []).map((m) => (m.user_a_id === myId ? m.user_b_id : m.user_a_id)),
  );
  const pendingIds = likerIds.filter((id) => !matchedIds.has(id));
  if (pendingIds.length === 0) return [];

  const [{ data: profiles }, { data: photos }] = await Promise.all([
    supabase.from("profiles").select("id, first_name").in("id", pendingIds),
    supabase.from("profile_photos").select("profile_id, storage_path").in("profile_id", pendingIds).eq("position", 0),
  ]);

  const photoById = new Map((photos ?? []).map((p) => [p.profile_id, p.storage_path]));
  return pendingIds.map((id) => ({
    id,
    first_name: profiles?.find((p) => p.id === id)?.first_name ?? null,
    photoPath: photoById.get(id) ?? null,
  }));
}

export function calculateAge(birthdate: string): number {
  const dob = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}
