-- Swipe-based discovery: likes/passes, GPS distance, Gold + Boost
-- entitlements (stubbed — no real payment processor wired up yet).

-- ============ PROFILES: location + entitlements ============
alter table public.profiles
  add column latitude double precision,
  add column longitude double precision,
  add column is_gold boolean not null default false,
  add column gold_expires_at timestamptz,
  add column boost_active_until timestamptz;

-- ============ MATCHES: allow swipe-originated matches ============
-- Existing rows always come from a date_session; swipe matches have none.
alter table public.matches alter column session_id drop not null;
alter table public.matches
  add column source text not null default 'speed_date' check (source in ('speed_date', 'swipe'));

-- ============ SWIPES ============
create table public.swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_id uuid not null references public.profiles(id) on delete cascade,
  swiped_id uuid not null references public.profiles(id) on delete cascade,
  action text not null check (action in ('like', 'pass', 'superlike')),
  created_at timestamptz not null default now(),
  unique (swiper_id, swiped_id),
  constraint swipes_different_users check (swiper_id <> swiped_id)
);

create index swipes_swiper_idx on public.swipes(swiper_id);
create index swipes_swiped_idx on public.swipes(swiped_id);

alter table public.swipes enable row level security;

create policy "swipes_select_own_or_admin"
  on public.swipes for select
  using (swiper_id = auth.uid() or swiped_id = auth.uid() or public.is_admin());

-- No insert/update/delete policy: all writes go through record_swipe()
-- below (security definer), so match-creation can't be bypassed by writing
-- a swipe row directly.
grant select on public.swipes to authenticated;

-- ============ DISTANCE ============
create or replace function public.haversine_km(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
)
returns double precision
language sql immutable
as $$
  select 6371 * acos(
    greatest(-1, least(1,
      cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1))
      + sin(radians(lat1)) * sin(radians(lat2))
    ))
  );
$$;

grant execute on function public.haversine_km(double precision, double precision, double precision, double precision) to authenticated;

-- ============ DISCOVER FEED ============
create or replace function public.discover_candidates(p_limit int default 20)
returns setof public.profiles
language plpgsql stable security definer set search_path = public
as $$
declare
  me public.profiles;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.id is null then
    return;
  end if;

  return query
  select p.*
  from public.profiles p
  where p.id <> auth.uid()
    and p.status = 'active'
    and p.onboarding_completed = true
    and p.birthdate is not null
    and (me.interested_in = '{}' or p.gender = any(me.interested_in))
    and (p.interested_in = '{}' or me.gender = any(p.interested_in))
    and extract(year from age(p.birthdate)) between me.min_age_pref and me.max_age_pref
    and not exists (
      select 1 from public.swipes s where s.swiper_id = auth.uid() and s.swiped_id = p.id
    )
    and (
      me.latitude is null or p.latitude is null
      or public.haversine_km(me.latitude, me.longitude, p.latitude, p.longitude) <= me.max_distance_km
    )
  order by
    (p.boost_active_until is not null and p.boost_active_until > now()) desc,
    random()
  limit p_limit;
end;
$$;

grant execute on function public.discover_candidates(int) to authenticated;

-- ============ RECORD SWIPE + MUTUAL-MATCH ============
create or replace function public.record_swipe(p_swiped_id uuid, p_action text)
returns table(matched boolean, match_id uuid)
language plpgsql security definer set search_path = public
as $$
declare
  v_mutual boolean;
  v_match_id uuid;
  v_user_a uuid;
  v_user_b uuid;
begin
  if p_action not in ('like', 'pass', 'superlike') then
    raise exception 'invalid swipe action: %', p_action;
  end if;

  insert into public.swipes (swiper_id, swiped_id, action)
  values (auth.uid(), p_swiped_id, p_action)
  on conflict (swiper_id, swiped_id) do update set action = excluded.action, created_at = now();

  if p_action = 'pass' then
    return query select false, null::uuid;
    return;
  end if;

  select exists (
    select 1 from public.swipes
    where swiper_id = p_swiped_id and swiped_id = auth.uid() and action in ('like', 'superlike')
  ) into v_mutual;

  if not v_mutual then
    return query select false, null::uuid;
    return;
  end if;

  v_user_a := least(auth.uid(), p_swiped_id);
  v_user_b := greatest(auth.uid(), p_swiped_id);

  select id into v_match_id from public.matches where user_a_id = v_user_a and user_b_id = v_user_b;

  if v_match_id is null then
    insert into public.matches (session_id, user_a_id, user_b_id, status, source)
    values (null, v_user_a, v_user_b, 'active', 'swipe')
    returning id into v_match_id;
  end if;

  return query select true, v_match_id;
end;
$$;

grant execute on function public.record_swipe(uuid, text) to authenticated;
