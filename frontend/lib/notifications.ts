import { supabase } from "./supabase";

export type AppNotification = {
  id: string;
  type: "match" | "message" | "referral";
  title: string;
  body: string;
  related_match_id: string | null;
  is_read: boolean;
  created_at: string;
};

export async function fetchNotifications(myId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, related_match_id, is_read, created_at")
    .eq("user_id", myId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function fetchUnreadNotificationCount(myId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", myId)
    .eq("is_read", false);
  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllNotificationsRead(myId: string): Promise<void> {
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", myId).eq("is_read", false);
}
