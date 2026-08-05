import { notFound } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import { ThreadView, type ThreadMessage } from "../../../../components/ThreadView";

type MatchRow = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  user_a: { id: string; first_name: string | null; is_operator: boolean } | null;
  user_b: { id: string; first_name: string | null; is_operator: boolean } | null;
};

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: match } = await supabase
    .from("matches")
    .select(
      `id, user_a_id, user_b_id,
       user_a:profiles!matches_user_a_id_fkey(id, first_name, is_operator),
       user_b:profiles!matches_user_b_id_fkey(id, first_name, is_operator)`,
    )
    .eq("id", matchId)
    .maybeSingle();

  if (!match) {
    notFound();
  }

  const typedMatch = match as unknown as MatchRow;
  const isParticipant = typedMatch.user_a_id === user.id || typedMatch.user_b_id === user.id;

  // Only an admin can load a match they're not part of (RLS returns nothing
  // otherwise), so a non-participant here is always a monitoring super-admin.
  const readOnly = !isParticipant;

  let headerProfile: { id: string; first_name: string | null } | null;
  let operatorId: string | undefined;

  if (isParticipant) {
    headerProfile = typedMatch.user_a_id === user.id ? typedMatch.user_b : typedMatch.user_a;
  } else {
    const aIsOperator = typedMatch.user_a?.is_operator ?? false;
    headerProfile = aIsOperator ? typedMatch.user_b : typedMatch.user_a;
    operatorId = aIsOperator ? typedMatch.user_a_id : typedMatch.user_b_id;
  }

  const { data: photo } = headerProfile
    ? await supabase
        .from("profile_photos")
        .select("storage_path")
        .eq("profile_id", headerProfile.id)
        .eq("position", 0)
        .maybeSingle()
    : { data: null };

  const photoUrl = photo
    ? supabase.storage.from("profile-photos").getPublicUrl(photo.storage_path).data.publicUrl
    : null;

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, content, read_at, created_at")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  return (
    <ThreadView
      matchId={matchId}
      currentUserId={user.id}
      otherProfile={{
        id: headerProfile?.id ?? "",
        firstName: headerProfile?.first_name ?? null,
        photoUrl,
      }}
      initialMessages={(messages ?? []) as ThreadMessage[]}
      readOnly={readOnly}
      operatorId={operatorId}
    />
  );
}
