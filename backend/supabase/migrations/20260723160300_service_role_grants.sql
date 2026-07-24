-- service_role has rolbypassrls = true (it skips RLS policies), but that is
-- a separate mechanism from base table grants — Postgres still checks
-- ordinary privileges first (see 20260723150000_grants.sql for the same
-- lesson applied to `authenticated`). service_role was never given base
-- grants, so every Edge Function using the admin client (getAdminClient() in
-- queue-join, queue-leave, date-decision, delete-account) has been silently
-- failing every query with "permission denied for table X" since the schema
-- was created — masked because these functions were never exercised
-- end-to-end before now.
grant usage on schema public to service_role;

grant select, insert, update, delete on
  public.profiles,
  public.profile_photos,
  public.speed_dating_queue,
  public.date_sessions,
  public.date_decisions,
  public.date_session_messages,
  public.matches,
  public.messages,
  public.reports,
  public.blocks,
  public.push_tokens,
  public.queue_join_events
to service_role;
