import { supabase } from "./supabase";

export type MatchListItem = {
  matchId: string;
  otherId: string;
  otherName: string | null;
  photoPath: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: boolean;
};

export async function fetchMatches(myId: string): Promise<MatchListItem[]> {
  const { data: matches, error } = await supabase
    .from("matches")
    .select("id, user_a_id, user_b_id, matched_at")
    .eq("status", "active")
    .or(`user_a_id.eq.${myId},user_b_id.eq.${myId}`)
    .order("matched_at", { ascending: false });

  if (error) throw error;
  if (!matches || matches.length === 0) return [];

  const otherIds = matches.map((m) => (m.user_a_id === myId ? m.user_b_id : m.user_a_id));
  const matchIds = matches.map((m) => m.id);

  const [{ data: profiles }, { data: photos }, { data: messages }] = await Promise.all([
    supabase.from("profiles").select("id, first_name").in("id", otherIds),
    supabase
      .from("profile_photos")
      .select("profile_id, storage_path")
      .in("profile_id", otherIds)
      .eq("position", 0),
    supabase
      .from("messages")
      .select("match_id, sender_id, content, created_at, read_at")
      .in("match_id", matchIds)
      .order("created_at", { ascending: false }),
  ]);

  type MessageRow = NonNullable<typeof messages>[number];

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const photoById = new Map((photos ?? []).map((p) => [p.profile_id, p.storage_path]));
  const latestMessageByMatch = new Map<string, MessageRow>();
  for (const message of messages ?? []) {
    if (!latestMessageByMatch.has(message.match_id)) {
      latestMessageByMatch.set(message.match_id, message);
    }
  }

  return matches.map((m) => {
    const otherId = m.user_a_id === myId ? m.user_b_id : m.user_a_id;
    const lastMessage = latestMessageByMatch.get(m.id);
    return {
      matchId: m.id,
      otherId,
      otherName: profileById.get(otherId)?.first_name ?? null,
      photoPath: photoById.get(otherId) ?? null,
      lastMessage: lastMessage?.content ?? null,
      lastMessageAt: lastMessage?.created_at ?? m.matched_at,
      unread: !!lastMessage && lastMessage.sender_id !== myId && !lastMessage.read_at,
    };
  });
}
