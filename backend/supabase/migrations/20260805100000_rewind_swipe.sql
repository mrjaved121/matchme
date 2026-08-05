-- Rewind: undo your most recent swipe. The Discover screen's Rewind button
-- was purely decorative (hardcoded disabled) until now — this makes it a
-- real action, matching the Stitch export where it's a plain enabled
-- button. Free vs. Gold "Unlimited Rewinds" gating is enforced client-side
-- for now (same shape as the other swipe limits could later be added
-- server-side in this function if that's ever needed).
create or replace function public.rewind_last_swipe()
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_swipe record;
begin
  select * into v_swipe
    from public.swipes
    where swiper_id = auth.uid()
    order by created_at desc
    limit 1;

  if v_swipe.id is null then
    raise exception 'no_swipe_to_rewind' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.matches
    where status = 'active'
      and ((user_a_id = auth.uid() and user_b_id = v_swipe.swiped_id)
        or (user_b_id = auth.uid() and user_a_id = v_swipe.swiped_id))
  ) then
    raise exception 'cannot_rewind_a_match' using errcode = 'P0001';
  end if;

  delete from public.swipes where id = v_swipe.id;

  return v_swipe.swiped_id;
end;
$$;

grant execute on function public.rewind_last_swipe() to authenticated;
