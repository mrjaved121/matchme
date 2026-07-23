-- Enable Realtime (postgres_changes) for tables clients subscribe to directly:
-- date_sessions so a waiting user's client learns it's been matched, and
-- messages for live chat.
alter publication supabase_realtime add table public.date_sessions;
alter publication supabase_realtime add table public.messages;
