-- Personal "save for later" bookmark list — independent of matching, lets a
-- user revisit a profile they noticed while swiping without needing to have
-- already liked or matched with them. Rows are purely personal, so RLS is a
-- straightforward "own rows only" — no participant/match check needed.
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  favorited_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, favorited_profile_id),
  check (user_id <> favorited_profile_id)
);

create index favorites_user_id_created_idx on public.favorites(user_id, created_at desc);

alter table public.favorites enable row level security;

create policy "favorites_select_own"
  on public.favorites for select
  using (user_id = auth.uid());

create policy "favorites_insert_own"
  on public.favorites for insert
  with check (user_id = auth.uid());

create policy "favorites_delete_own"
  on public.favorites for delete
  using (user_id = auth.uid());

grant select, insert, delete on public.favorites to authenticated;
