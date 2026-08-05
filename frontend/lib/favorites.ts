import { supabase } from "./supabase";

export type FavoriteProfile = {
  id: string;
  first_name: string | null;
  birthdate: string | null;
  city: string | null;
  photoPath: string | null;
  favoritedAt: string;
};

export async function isFavorited(myId: string, targetId: string): Promise<boolean> {
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", myId)
    .eq("favorited_profile_id", targetId)
    .maybeSingle();
  return !!data;
}

export async function addFavorite(myId: string, targetId: string): Promise<void> {
  const { error } = await supabase.from("favorites").insert({ user_id: myId, favorited_profile_id: targetId });
  if (error) throw error;
}

export async function removeFavorite(myId: string, targetId: string): Promise<void> {
  const { error } = await supabase.from("favorites").delete().eq("user_id", myId).eq("favorited_profile_id", targetId);
  if (error) throw error;
}

export async function fetchFavorites(myId: string): Promise<FavoriteProfile[]> {
  const { data: favs } = await supabase
    .from("favorites")
    .select("favorited_profile_id, created_at")
    .eq("user_id", myId)
    .order("created_at", { ascending: false });

  const ids = (favs ?? []).map((f) => f.favorited_profile_id);
  if (ids.length === 0) return [];

  const [{ data: profiles }, { data: photos }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, birthdate, city").in("id", ids),
    supabase.from("profile_photos").select("profile_id, storage_path").in("profile_id", ids).eq("position", 0),
  ]);

  const photoById = new Map((photos ?? []).map((p) => [p.profile_id, p.storage_path]));
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (favs ?? [])
    .filter((f) => profileById.has(f.favorited_profile_id))
    .map((f) => {
      const p = profileById.get(f.favorited_profile_id)!;
      return {
        id: f.favorited_profile_id,
        first_name: p.first_name,
        birthdate: p.birthdate,
        city: p.city,
        photoPath: photoById.get(f.favorited_profile_id) ?? null,
        favoritedAt: f.created_at,
      };
    });
}
