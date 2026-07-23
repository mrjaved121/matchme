-- Row Level Security for all MatchMe tables + storage.
-- Writes to date_sessions / matches (beyond participant unmatch) happen via
-- Edge Functions using the service role key, which bypasses RLS entirely.

-- ============ HELPER FUNCTIONS ============
-- security definer so these can safely read profiles/matches/date_sessions
-- from inside a policy without recursing into RLS on those tables.

create function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create function public.is_session_participant(p_session_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.date_sessions
    where id = p_session_id
      and (user_a_id = auth.uid() or user_b_id = auth.uid())
  );
$$;

create function public.is_match_participant(p_match_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.matches
    where id = p_match_id
      and (user_a_id = auth.uid() or user_b_id = auth.uid())
  );
$$;

-- ============ PROFILES ============
alter table public.profiles enable row level security;

create policy "profiles_select_active_or_own_or_admin"
  on public.profiles for select
  using (status = 'active' or id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "profiles_delete_own_or_admin"
  on public.profiles for delete
  using (id = auth.uid() or public.is_admin());

-- ============ PROFILE PHOTOS ============
alter table public.profile_photos enable row level security;

create policy "profile_photos_select_authenticated"
  on public.profile_photos for select
  to authenticated
  using (true);

create policy "profile_photos_insert_own"
  on public.profile_photos for insert
  with check (profile_id = auth.uid());

create policy "profile_photos_update_own"
  on public.profile_photos for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "profile_photos_delete_own_or_admin"
  on public.profile_photos for delete
  using (profile_id = auth.uid() or public.is_admin());

-- ============ SPEED DATING QUEUE ============
alter table public.speed_dating_queue enable row level security;

create policy "queue_select_own_or_admin"
  on public.speed_dating_queue for select
  using (profile_id = auth.uid() or public.is_admin());

create policy "queue_insert_own"
  on public.speed_dating_queue for insert
  with check (profile_id = auth.uid());

create policy "queue_delete_own_or_admin"
  on public.speed_dating_queue for delete
  using (profile_id = auth.uid() or public.is_admin());

-- ============ DATE SESSIONS ============
-- No client insert/update policy: sessions are created and closed by the
-- matchmaking Edge Function via the service role key.
alter table public.date_sessions enable row level security;

create policy "date_sessions_select_participant_or_admin"
  on public.date_sessions for select
  using (user_a_id = auth.uid() or user_b_id = auth.uid() or public.is_admin());

-- ============ DATE DECISIONS ============
alter table public.date_decisions enable row level security;

create policy "date_decisions_select_own_or_admin"
  on public.date_decisions for select
  using (profile_id = auth.uid() or public.is_admin());

create policy "date_decisions_insert_own_participant"
  on public.date_decisions for insert
  with check (profile_id = auth.uid() and public.is_session_participant(session_id));

-- ============ MATCHES ============
alter table public.matches enable row level security;

create policy "matches_select_participant_or_admin"
  on public.matches for select
  using (user_a_id = auth.uid() or user_b_id = auth.uid() or public.is_admin());

create policy "matches_update_participant_or_admin"
  on public.matches for update
  using (user_a_id = auth.uid() or user_b_id = auth.uid() or public.is_admin())
  with check (user_a_id = auth.uid() or user_b_id = auth.uid() or public.is_admin());

-- ============ MESSAGES ============
alter table public.messages enable row level security;

create policy "messages_select_participant_or_admin"
  on public.messages for select
  using (public.is_match_participant(match_id) or public.is_admin());

create policy "messages_insert_participant"
  on public.messages for insert
  with check (sender_id = auth.uid() and public.is_match_participant(match_id));

create policy "messages_update_participant"
  on public.messages for update
  using (public.is_match_participant(match_id))
  with check (public.is_match_participant(match_id));

-- ============ REPORTS ============
alter table public.reports enable row level security;

create policy "reports_select_own_or_admin"
  on public.reports for select
  using (reporter_id = auth.uid() or public.is_admin());

create policy "reports_insert_own"
  on public.reports for insert
  with check (reporter_id = auth.uid());

create policy "reports_update_admin_only"
  on public.reports for update
  using (public.is_admin())
  with check (public.is_admin());

-- ============ BLOCKS ============
alter table public.blocks enable row level security;

create policy "blocks_select_own_or_admin"
  on public.blocks for select
  using (blocker_id = auth.uid() or public.is_admin());

create policy "blocks_insert_own"
  on public.blocks for insert
  with check (blocker_id = auth.uid());

create policy "blocks_delete_own"
  on public.blocks for delete
  using (blocker_id = auth.uid());

-- ============ PUSH TOKENS ============
alter table public.push_tokens enable row level security;

create policy "push_tokens_all_own"
  on public.push_tokens for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ============ STORAGE: profile-photos bucket ============
-- Path convention: {profile_id}/{filename}
create policy "profile_photos_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

create policy "profile_photos_bucket_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile_photos_bucket_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile_photos_bucket_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
