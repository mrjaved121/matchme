-- Operator inbox: lets designated real profile-holders (e.g. group members who
-- run seeded profiles as themselves) sign into the web dashboard and reply to
-- their own conversations. They are normal match participants, so existing
-- messages/matches RLS already covers read + send — this migration only adds
-- the operator flag and a helper, plus admin-visibility conveniences.

alter table public.profiles
  add column is_operator boolean not null default false;

create index if not exists profiles_is_operator_idx
  on public.profiles(is_operator) where is_operator;

-- Mirrors public.is_admin(): true when the current user is a flagged operator.
create or replace function public.is_operator()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select is_operator from public.profiles where id = auth.uid()), false);
$$;

grant execute on function public.is_operator() to authenticated;

-- To designate operators, flag their profile accounts, e.g.:
--   update public.profiles set is_operator = true
--   where id in (select id from auth.users where email = 'wilma123@gmail.com');
-- Operators reply as themselves; no impersonation of another identity.
