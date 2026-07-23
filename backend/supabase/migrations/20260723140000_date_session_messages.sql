-- Live chat during a timed speed-dating session (distinct from `messages`,
-- which is the ongoing conversation after a mutual match). Ephemeral to the
-- session: not carried over into the match chat if the pair matches.
create table public.date_session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.date_sessions(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index date_session_messages_session_id_created_idx
  on public.date_session_messages(session_id, created_at);

alter table public.date_session_messages enable row level security;

create policy "date_session_messages_select_participant_or_admin"
  on public.date_session_messages for select
  using (public.is_session_participant(session_id) or public.is_admin());

create policy "date_session_messages_insert_participant"
  on public.date_session_messages for insert
  with check (sender_id = auth.uid() and public.is_session_participant(session_id));

alter publication supabase_realtime add table public.date_session_messages;
