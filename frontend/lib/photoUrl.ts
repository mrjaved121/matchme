import { supabase } from "./supabase";

// Seed/demo profiles reference full external photo URLs directly (no real
// file uploaded to Storage) rather than a Storage path — pass those through
// unchanged instead of mangling them into an invalid Storage URL.
export function publicPhotoUrl(storagePath: string): string {
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }
  return supabase.storage.from("profile-photos").getPublicUrl(storagePath).data.publicUrl;
}
