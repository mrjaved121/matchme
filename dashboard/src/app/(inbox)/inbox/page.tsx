import { createClient } from "../../../lib/supabase/server";
import { ConversationList, type ConversationRow } from "../../../components/ConversationList";

type MatchRow = {
  id: string;
  matched_at: string;
  user_a_id: string;
  user_b_id: string;
  user_a: { id: string; first_name: string | null } | null;
  user_b: { id: string; first_name: string | null } | null;
};

type MessageRow = {
  match_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      `id, matched_at, user_a_id, user_b_id,
       user_a:profiles!matches_user_a_id_fkey(id, first_name),
       user_b:profiles!matches_user_b_id_fkey(id, first_name)`,
    )
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("matched_at", { ascending: false });

  const typedMatches = (matches ?? []) as unknown as MatchRow[];
  const matchIds = typedMatches.map((m) => m.id);

  const { data: messages } = matchIds.length
    ? await supabase
        .from("messages")
        .select("match_id, sender_id, content, read_at, created_at")
        .in("match_id", matchIds)
        .order("created_at", { ascending: false })
    : { data: [] as MessageRow[] };

  const lastMessageByMatch = new Map<string, MessageRow>();
  const unreadByMatch = new Map<string, number>();
  for (const message of (messages ?? []) as MessageRow[]) {
    if (!lastMessageByMatch.has(message.match_id)) {
      lastMessageByMatch.set(message.match_id, message);
    }
    if (message.sender_id !== user.id && !message.read_at) {
      unreadByMatch.set(message.match_id, (unreadByMatch.get(message.match_id) ?? 0) + 1);
    }
  }

  const otherIds = typedMatches
    .map((m) => (m.user_a_id === user.id ? m.user_b?.id : m.user_a?.id))
    .filter((id): id is string => Boolean(id));

  const { data: photos } = otherIds.length
    ? await supabase
        .from("profile_photos")
        .select("profile_id, storage_path")
        .in("profile_id", otherIds)
        .eq("position", 0)
    : { data: [] };

  const photoByProfile = new Map(
    (photos ?? []).map((p) => [
      p.profile_id,
      supabase.storage.from("profile-photos").getPublicUrl(p.storage_path).data.publicUrl,
    ]),
  );

  const rows: ConversationRow[] = typedMatches.map((m) => {
    const other = m.user_a_id === user.id ? m.user_b : m.user_a;
    const lastMessage = lastMessageByMatch.get(m.id);
    return {
      matchId: m.id,
      matchedAt: m.matched_at,
      otherProfile: {
        id: other?.id ?? "",
        firstName: other?.first_name ?? null,
        photoUrl: other ? (photoByProfile.get(other.id) ?? null) : null,
      },
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            createdAt: lastMessage.created_at,
            isMine: lastMessage.sender_id === user.id,
          }
        : null,
      unreadCount: unreadByMatch.get(m.id) ?? 0,
    };
  });

  rows.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ?? a.matchedAt;
    const bTime = b.lastMessage?.createdAt ?? b.matchedAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">Inbox</h1>

      {error ? (
        <p className="text-error">{error.message}</p>
      ) : (
        <ConversationList conversations={rows} currentUserId={user.id} />
      )}
    </div>
  );
}
