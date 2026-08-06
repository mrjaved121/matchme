-- discover_candidates() never excluded blocked users. In practice this
-- rarely mattered since anyone already swiped on (like/pass) is already
-- excluded regardless -- but blocking someone you never swiped on (e.g.
-- via a profile view or the report flow) could still resurface them in
-- the deck. Messaging itself was already safe either way (can_message()
-- checks blocks independent of how a match formed), this just keeps
-- blocked people out of the deck too.
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
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocked_id = auth.uid() and b.blocker_id = p.id)
    )
    and (
      me.global_mode = true
      or me.latitude is null or p.latitude is null
      or public.haversine_km(me.latitude, me.longitude, p.latitude, p.longitude) <= me.max_distance_km
    )
  order by
    (p.boost_active_until is not null and p.boost_active_until > now()) desc,
    random()
  limit p_limit;
end;
$$;
