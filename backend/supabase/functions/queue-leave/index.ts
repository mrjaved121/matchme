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

  const admin = getAdminClient();
  await admin.from("speed_dating_queue").delete().eq("profile_id", user.id);

  return new Response(JSON.stringify({ status: "left" }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
