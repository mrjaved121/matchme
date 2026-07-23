-- Postgres requires a base GRANT before RLS policies matter at all — RLS
-- only *narrows* what a role's existing privileges allow, it doesn't grant
-- access on its own. Supabase's new-project default no longer auto-exposes
-- newly created tables to the `anon`/`authenticated` API roles (see
-- api.auto_expose_new_tables in config.toml), so every table created by the
-- earlier migrations needs this explicitly. RLS policies (already in place)
-- remain the real access control; these grants just let PostgREST attempt
-- the query at all.
grant usage on schema public to anon, authenticated;

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
  public.push_tokens
to authenticated;
