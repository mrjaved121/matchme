-- Single-row app-wide config the admin dashboard can edit without a
-- redeploy — starts with the values that were previously hardcoded
-- (daily like/superlike limits, Gold pricing display).
create table public.app_config (
  id boolean primary key default true check (id),
  daily_like_limit int not null default 20,
  superlike_limit_free int not null default 1,
  superlike_limit_gold int not null default 5,
  gold_weekly_price_usd numeric(6,2) not null default 9.99,
  gold_monthly_price_usd numeric(6,2) not null default 19.99,
  gold_annual_price_usd numeric(6,2) not null default 9.99,
  updated_at timestamptz not null default now()
);

insert into public.app_config (id) values (true);

create trigger app_config_set_updated_at
  before update on public.app_config
  for each row execute function public.set_updated_at();

alter table public.app_config enable row level security;

create policy "app_config_select_authenticated"
  on public.app_config for select
  to authenticated
  using (true);

create policy "app_config_update_admin_only"
  on public.app_config for update
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.app_config to authenticated;
grant update on public.app_config to authenticated;

-- record_swipe now reads limits from app_config instead of hardcoded constants.
create or replace function public.record_swipe(p_swiped_id uuid, p_action text)
returns table(matched boolean, match_id uuid)
language plpgsql security definer set search_path = public
as $$
declare
  v_mutual boolean;
  v_match_id uuid;
  v_user_a uuid;
  v_user_b uuid;
  v_is_gold boolean;
  v_likes_today int;
  v_superlikes_today int;
  v_config public.app_config;
begin
  if p_action not in ('like', 'pass', 'superlike') then
    raise exception 'invalid swipe action: %', p_action;
  end if;

  select * into v_config from public.app_config where id = true;

  if p_action in ('like', 'superlike') then
    select is_gold and (gold_expires_at is null or gold_expires_at > now())
      into v_is_gold
      from public.profiles where id = auth.uid();

    select count(*) into v_likes_today
      from public.swipes
      where swiper_id = auth.uid()
        and action in ('like', 'superlike')
        and created_at >= date_trunc('day', now());

    if not v_is_gold and v_likes_today >= v_config.daily_like_limit then
      raise exception 'daily_like_limit_reached' using errcode = 'P0001';
    end if;

    if p_action = 'superlike' then
      select count(*) into v_superlikes_today
        from public.swipes
        where swiper_id = auth.uid()
          and action = 'superlike'
          and created_at >= date_trunc('day', now());

      if v_superlikes_today >= (case when v_is_gold then v_config.superlike_limit_gold else v_config.superlike_limit_free end) then
        raise exception 'daily_superlike_limit_reached' using errcode = 'P0001';
      end if;
    end if;
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
