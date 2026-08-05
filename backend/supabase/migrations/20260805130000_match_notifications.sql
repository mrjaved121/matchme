-- record_swipe now also writes an in-app notification for both participants
-- when a new mutual match is created (only on first creation, not on the
-- existing-match lookup branch).
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

    insert into public.notifications (user_id, type, title, body, related_match_id)
    values
      (v_user_a, 'match', 'You have a new match!', 'Say hello and start the conversation.', v_match_id),
      (v_user_b, 'match', 'You have a new match!', 'Say hello and start the conversation.', v_match_id);
  end if;

  return query select true, v_match_id;
end;
$$;
