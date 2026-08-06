-- Two gaps found in a messaging audit:
--
-- 1. is_match_participant() only checks user_a_id/user_b_id, never status,
--    so unmatching never actually stopped either side from continuing to
--    insert messages into that match_id.
-- 2. Blocking someone only ever wrote a row to public.blocks; nothing
--    checked it before allowing a message, and it didn't touch the match
--    itself, so a blocked conversation kept messaging fine and stayed in
--    both parties' active matches list.
--
-- Fix: message-sending now goes through can_message(), which requires the
-- match to still be active AND that neither party has blocked the other.
-- Blocking someone also auto-unmatches any active match with them, which
-- both closes the messaging hole via the status check and makes the
-- conversation disappear from the matches list (existing client behavior
-- already filters matches by status = 'active').
--
-- Marking old messages read (messages_update_participant) and reading
-- history (messages_select_participant_or_admin) are intentionally left
-- alone -- viewing/clearing a dead conversation should still work, same
-- as it already does after a plain unmatch.

create or replace function public.can_message(p_match_id uuid, p_sender_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.matches m
    where m.id = p_match_id
      and m.status = 'active'
      and (m.user_a_id = p_sender_id or m.user_b_id = p_sender_id)
      and not exists (
        select 1
        from public.blocks b
        where (b.blocker_id = p_sender_id and b.blocked_id = case when m.user_a_id = p_sender_id then m.user_b_id else m.user_a_id end)
           or (b.blocked_id = p_sender_id and b.blocker_id = case when m.user_a_id = p_sender_id then m.user_b_id else m.user_a_id end)
      )
  );
$$;

grant execute on function public.can_message(uuid, uuid) to authenticated;

drop policy "messages_insert_participant" on public.messages;

create policy "messages_insert_participant"
  on public.messages for insert
  with check (sender_id = auth.uid() and public.can_message(match_id, sender_id));

-- Blocking someone auto-unmatches any active match with them. Deliberately
-- one-directional: unblocking later does not resurrect the match, same as
-- a regular unmatch is already final in the client's own confirm copy.
create or replace function public.unmatch_on_block()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.matches
  set status = 'unmatched'
  where status = 'active'
    and ((user_a_id = new.blocker_id and user_b_id = new.blocked_id)
      or (user_a_id = new.blocked_id and user_b_id = new.blocker_id));
  return new;
end;
$$;

create trigger blocks_unmatch_on_insert
  after insert on public.blocks
  for each row execute function public.unmatch_on_block();
