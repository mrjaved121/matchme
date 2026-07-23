// Self-serve account deletion. Deleting the auth.users row cascades to
// profiles and, from there, through every FK chain defined in
// 20260723120000_init_schema.sql (photos, queue, sessions, decisions,
// matches, messages) via ON DELETE CASCADE.
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
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ status: "deleted" }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
