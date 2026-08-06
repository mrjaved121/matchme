-- With a small early user base, requiring BOTH people to like each other
-- before either can message was too high a bar -- most likes just sat
-- there with no way to reach the person. Liking someone now unlocks
-- messaging immediately (still requires the liker to take that one
-- deliberate action -- this is not open "anyone messages anyone").
-- can_message() and the blocks/unmatch protections from the earlier
-- migration are untouched, so blocking and unmatching still work exactly
-- the same as before.
create or replace function public.record_swipe(p_swiped_id uuid, p_action text)
returns table(matched boolean, match_id uuid, mutual boolean)
language plpgsql security definer set search_path = public
as $$
declare
  v_match_id uuid;
  v_user_a uuid;
  v_user_b uuid;
  v_already_liked_me boolean;
begin
  if p_action not in ('like', 'pass', 'superlike') then
    raise exception 'invalid swipe action: %', p_action;
  end if;

  select exists (
    select 1 from public.swipes
    where swiper_id = p_swiped_id and swiped_id = auth.uid() and action in ('like', 'superlike')
  ) into v_already_liked_me;

  insert into public.swipes (swiper_id, swiped_id, action)
  values (auth.uid(), p_swiped_id, p_action)
  on conflict (swiper_id, swiped_id) do update set action = excluded.action, created_at = now();

  if p_action = 'pass' then
    return query select false, null::uuid, false;
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

  return query select true, v_match_id, v_already_liked_me;
end;
$$;

grant execute on function public.record_swipe(uuid, text) to authenticated;

-- Rewind used to unconditionally refuse to undo a swipe that already has
-- an active match, back when a match only ever meant genuine mutual
-- interest. Now that a single like creates one immediately, that would
-- make Rewind useless for its main case (undoing an accidental like) --
-- so it may now undo the match too, as long as nobody has actually sent a
-- message in it yet. Once a real conversation has started, it's final,
-- same as before.
create or replace function public.rewind_last_swipe()
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_swipe record;
  v_match record;
begin
  select * into v_swipe
    from public.swipes
    where swiper_id = auth.uid()
    order by created_at desc
    limit 1;

  if v_swipe.id is null then
    raise exception 'no_swipe_to_rewind' using errcode = 'P0001';
  end if;

  select * into v_match
    from public.matches
    where status = 'active'
      and ((user_a_id = auth.uid() and user_b_id = v_swipe.swiped_id)
        or (user_b_id = auth.uid() and user_a_id = v_swipe.swiped_id));

  if v_match.id is not null then
    if exists (select 1 from public.messages where match_id = v_match.id) then
      raise exception 'cannot_rewind_a_match' using errcode = 'P0001';
    end if;
    update public.matches set status = 'unmatched' where id = v_match.id;
  end if;

  delete from public.swipes where id = v_swipe.id;

  return v_swipe.swiped_id;
end;
$$;
