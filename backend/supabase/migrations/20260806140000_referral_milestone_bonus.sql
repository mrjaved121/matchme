-- Milestone bonus on top of the existing per-referral reward: once a
-- referrer's 10th referred friend completes onboarding, they get a full
-- free month of Gold (stacking on whatever per-referral weeks they've
-- already banked) plus a celebratory in-app notification. One-time, not
-- re-triggered by referral #11+.
alter table public.profiles
  add column referral_milestone_10_granted boolean not null default false;

alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('match', 'message', 'referral'));

create or replace function public.grant_referral_reward(p_referred_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_referrer_id uuid;
  v_already_granted boolean;
  v_reward_until timestamptz := now() + interval '7 days';
  v_referral_count int;
  v_milestone_granted boolean;
begin
  select referred_by, referral_reward_granted into v_referrer_id, v_already_granted
    from public.profiles where id = p_referred_id;

  if v_referrer_id is null or v_already_granted then
    return;
  end if;

  update public.profiles
    set is_gold = true,
        gold_expires_at = greatest(coalesce(gold_expires_at, now()), v_reward_until)
    where id in (p_referred_id, v_referrer_id);

  update public.profiles set referral_reward_granted = true where id = p_referred_id;

  select count(*) into v_referral_count
    from public.profiles
    where referred_by = v_referrer_id and referral_reward_granted = true;

  select referral_milestone_10_granted into v_milestone_granted
    from public.profiles where id = v_referrer_id;

  if v_referral_count >= 10 and not v_milestone_granted then
    update public.profiles
      set referral_milestone_10_granted = true,
          gold_expires_at = greatest(coalesce(gold_expires_at, now()), now() + interval '30 days')
      where id = v_referrer_id;

    insert into public.notifications (user_id, type, title, body)
    values (
      v_referrer_id,
      'referral',
      'You unlocked a referral bonus!',
      '10 friends have joined through your invite -- enjoy a free month of Gold on us.'
    );
  end if;
end;
$$;
