// Records a participant's private yes/no decision for a finished date
// session. Once both participants have decided, the session is closed and,
// if both said yes, a match row is created.
import { corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, requireUser } from "../_shared/client.ts";

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

  const body = await req.json().catch(() => null);
  const sessionId = body?.session_id as string | undefined;
  const decision = body?.decision as string | undefined;

  if (!sessionId || (decision !== "yes" && decision !== "no")) {
    return new Response(JSON.stringify({ error: "session_id and decision ('yes'|'no') are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = getAdminClient();

  const { data: session, error: sessionError } = await admin
    .from("date_sessions")
    .select("id, user_a_id, user_b_id, status")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return new Response(JSON.stringify({ error: "session not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (session.user_a_id !== user.id && session.user_b_id !== user.id) {
    return new Response(JSON.stringify({ error: "not a participant of this session" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await admin
    .from("date_decisions")
    .upsert(
      { session_id: sessionId, profile_id: user.id, decision },
      { onConflict: "session_id,profile_id" },
    );

  const { data: decisions } = await admin
    .from("date_decisions")
    .select("profile_id, decision")
    .eq("session_id", sessionId);

  const otherUserId = session.user_a_id === user.id ? session.user_b_id : session.user_a_id;
  const otherDecision = decisions?.find((d) => d.profile_id === otherUserId)?.decision;

  if (!otherDecision) {
    return new Response(JSON.stringify({ status: "waiting_on_other" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const bothYes = decision === "yes" && otherDecision === "yes";

  await admin
    .from("date_sessions")
    .update({ status: "completed", ended_at: new Date().toISOString() })
    .eq("id", sessionId);

  let match = null;

  if (bothYes) {
    const { data: matchRow } = await admin
      .from("matches")
      .upsert(
        {
          session_id: sessionId,
          user_a_id: session.user_a_id,
          user_b_id: session.user_b_id,
        },
        { onConflict: "session_id" },
      )
      .select()
      .single();
    match = matchRow;
  }

  return new Response(JSON.stringify({ status: "completed", matched: bothYes, match }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
