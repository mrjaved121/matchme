// Joins the speed-dating queue and attempts an immediate match against
// whoever has been waiting longest and is mutually compatible. If no one
// compatible is currently waiting, the caller is left in the queue and the
// client should listen for a new `date_sessions` row via Realtime (it will
// appear once someone else joins and matches with them).
import { corsHeaders } from "../_shared/cors.ts";
import { ageFromBirthdate, getAdminClient, requireUser } from "../_shared/client.ts";

interface CandidateProfile {
  id: string;
  gender: string;
  interested_in: string[];
  birthdate: string;
  status: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const user = await requireUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = getAdminClient();

  const { data: me, error: meError } = await admin
    .from("profiles")
    .select("id, gender, interested_in, birthdate, min_age_pref, max_age_pref, status, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (meError || !me) {
    return new Response(JSON.stringify({ error: "profile not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!me.onboarding_completed || me.status !== "active" || !me.gender || !me.birthdate) {
    return new Response(
      JSON.stringify({ error: "profile is not ready to join the queue" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const myAge = ageFromBirthdate(me.birthdate);

  // Ensure caller has a queue entry (idempotent).
  await admin
    .from("speed_dating_queue")
    .upsert({ profile_id: user.id }, { onConflict: "profile_id", ignoreDuplicates: true });

  // Who has blocked / been blocked by the caller? Exclude them from matching.
  const { data: blockRows } = await admin
    .from("blocks")
    .select("blocker_id, blocked_id")
    .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

  const blockedIds = new Set<string>();
  for (const row of blockRows ?? []) {
    blockedIds.add(row.blocker_id === user.id ? row.blocked_id : row.blocker_id);
  }

  // Oldest-waiting candidates first, excluding the caller.
  const { data: queueRows } = await admin
    .from("speed_dating_queue")
    .select("profile_id, joined_at")
    .neq("profile_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(50);

  const candidateIds = (queueRows ?? [])
    .map((r) => r.profile_id)
    .filter((id) => !blockedIds.has(id));

  let match: CandidateProfile | null = null;

  if (candidateIds.length > 0) {
    const { data: candidates } = await admin
      .from("profiles")
      .select("id, gender, interested_in, birthdate, status")
      .in("id", candidateIds)
      .eq("status", "active");

    const byId = new Map((candidates ?? []).map((c) => [c.id, c as CandidateProfile]));

    for (const id of candidateIds) {
      const candidate = byId.get(id);
      if (!candidate || !candidate.birthdate) continue;

      const candidateAge = ageFromBirthdate(candidate.birthdate);
      const iLikeThem = me.interested_in.includes(candidate.gender);
      const theyLikeMe = candidate.interested_in.includes(me.gender);
      const ageOkForMe = candidateAge >= me.min_age_pref && candidateAge <= me.max_age_pref;

      if (iLikeThem && theyLikeMe && ageOkForMe) {
        match = candidate;
        break;
      }
    }
  }

  if (!match) {
    return new Response(JSON.stringify({ status: "waiting" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const roomName = `date-${crypto.randomUUID()}`;

  const { data: session, error: sessionError } = await admin
    .from("date_sessions")
    .insert({
      user_a_id: user.id,
      user_b_id: match.id,
      room_name: roomName,
    })
    .select()
    .single();

  if (sessionError) {
    return new Response(JSON.stringify({ error: sessionError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await admin.from("speed_dating_queue").delete().in("profile_id", [user.id, match.id]);

  return new Response(JSON.stringify({ status: "matched", session }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
