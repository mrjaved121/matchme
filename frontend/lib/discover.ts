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
  last_active_at: string | null;
  show_age: boolean;
  show_distance: boolean;
  love_language: string | null;
  created_at: string;
};

export async function fetchDiscoverCandidates(limit = 15): Promise<DiscoverCandidate[]> {
  const { data, error } = await supabase.rpc("discover_candidates", { p_limit: limit });
  if (error) throw error;
  return data ?? [];
}

export type MySnapshot = {
  interest_tags: string[];
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  age: number | null;
  filter_verified_only: boolean;
  filter_online_only: boolean;
  filter_recently_active_only: boolean;
  filter_new_members_only: boolean;
};

export async function fetchMySnapshot(myId: string): Promise<MySnapshot> {
  const { data } = await supabase
    .from("profiles")
    .select(
      "interest_tags, city, latitude, longitude, birthdate, filter_verified_only, filter_online_only, filter_recently_active_only, filter_new_members_only",
    )
    .eq("id", myId)
    .single();
  return {
    interest_tags: data?.interest_tags ?? [],
    city: data?.city ?? null,
    latitude: data?.latitude ?? null,
    longitude: data?.longitude ?? null,
    age: data?.birthdate ? calculateAge(data.birthdate) : null,
    filter_verified_only: data?.filter_verified_only ?? false,
    filter_online_only: data?.filter_online_only ?? false,
    filter_recently_active_only: data?.filter_recently_active_only ?? false,
    filter_new_members_only: data?.filter_new_members_only ?? false,
  };
}

/** "Recently Active" advanced filter — a much looser window than
 * isRecentlyOnline's "online right now" (5 min) check. */
export function isActiveWithin24h(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() < 24 * 60 * 60 * 1000;
}

export function isNewMember(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
}

export function applyAdvancedFilters(me: MySnapshot, candidates: DiscoverCandidate[]): DiscoverCandidate[] {
  return candidates.filter((c) => {
    if (me.filter_verified_only && !c.is_verified) return false;
    if (me.filter_online_only && !isRecentlyOnline(c.last_active_at)) return false;
    if (me.filter_recently_active_only && !isActiveWithin24h(c.last_active_at)) return false;
    if (me.filter_new_members_only && !isNewMember(c.created_at)) return false;
    return true;
  });
}

/** A real score from shared signal (interests, city, age proximity) — never
 * a fabricated number. Weighted: interests 50, city 25, age closeness 25. */
export function computeCompatibility(
  me: MySnapshot,
  candidate: { interest_tags: string[]; city: string | null; birthdate: string | null },
): number {
  let score = 0;

  if (me.interest_tags.length > 0 && candidate.interest_tags.length > 0) {
    const shared = me.interest_tags.filter((t) => candidate.interest_tags.includes(t));
    const union = new Set([...me.interest_tags, ...candidate.interest_tags]).size;
    score += union > 0 ? (shared.length / union) * 50 : 0;
  }

  if (me.city && candidate.city && me.city.trim().toLowerCase() === candidate.city.trim().toLowerCase()) {
    score += 25;
  }

  if (me.age && candidate.birthdate) {
    const candidateAge = calculateAge(candidate.birthdate);
    const diff = Math.abs(me.age - candidateAge);
    score += Math.max(0, 25 - diff * 2.5);
  }

  return Math.max(1, Math.min(99, Math.round(score)));
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(
  me: { latitude: number | null; longitude: number | null },
  candidate: { latitude: number | null; longitude: number | null; city: string | null },
): string | null {
  if (me.latitude != null && me.longitude != null && candidate.latitude != null && candidate.longitude != null) {
    const km = haversineKm(me.latitude, me.longitude, candidate.latitude, candidate.longitude);
    const miles = km * 0.621371;
    return `${Math.max(1, Math.round(miles))} mi away`;
  }
  return candidate.city;
}

export function isRecentlyOnline(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() < 5 * 60 * 1000;
}

export type SwipeAction = "like" | "pass" | "superlike";

export async function recordSwipe(swipedId: string, action: SwipeAction) {
  const { data, error } = await supabase
    .rpc("record_swipe", { p_swiped_id: swipedId, p_action: action })
    .single();
  if (error) throw error;
  return data as { matched: boolean; match_id: string | null };
}

/** Undoes the caller's most recent swipe server-side. Returns the swiped
 * profile's id so the card can be restored to the top of the local deck. */
export async function rewindLastSwipe(): Promise<string> {
  const { data, error } = await supabase.rpc("rewind_last_swipe");
  if (error) throw error;
  return data as string;
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

export type Liker = {
  id: string;
  first_name: string | null;
  photoPath: string | null;
  birthdate: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

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
    supabase.from("profiles").select("id, first_name, birthdate, city, latitude, longitude").in("id", pendingIds),
    supabase.from("profile_photos").select("profile_id, storage_path").in("profile_id", pendingIds).eq("position", 0),
  ]);

  const photoById = new Map((photos ?? []).map((p) => [p.profile_id, p.storage_path]));
  return pendingIds.map((id) => {
    const profile = profiles?.find((p) => p.id === id);
    return {
      id,
      first_name: profile?.first_name ?? null,
      photoPath: photoById.get(id) ?? null,
      birthdate: profile?.birthdate ?? null,
      city: profile?.city ?? null,
      latitude: profile?.latitude ?? null,
      longitude: profile?.longitude ?? null,
    };
  });
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
