-- Append-only log of queue-join attempts, used to rate limit how often a
-- user can join the speed-dating queue. Rows are never deleted by app logic
-- (unlike speed_dating_queue, which is cleared on match/cancel) so recent
-- history survives to be counted.
create table public.queue_join_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index queue_join_events_profile_created_idx
  on public.queue_join_events(profile_id, created_at);

alter table public.queue_join_events enable row level security;

create policy "queue_join_events_select_own_or_admin"
  on public.queue_join_events for select
  using (profile_id = auth.uid() or public.is_admin());

-- See 20260723150000_grants.sql: RLS alone does not expose a table to
-- PostgREST, a base grant is required too.
grant select, insert on public.queue_join_events to authenticated;
