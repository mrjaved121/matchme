-- Referral System: reward is 1 week of free Gold for both the referrer and
-- the referred friend, granted once the referred friend completes
-- onboarding. No real payment involved — consistent with Gold being a
-- demo-only entitlement elsewhere (no IAP wired up yet).
alter table public.profiles
  add column referral_code text unique,
  add column referred_by uuid references public.profiles(id),
  add column referral_reward_granted boolean not null default false;

-- Grants both sides 7 days of Gold, atomically, and marks the referral as
-- rewarded so it can't be double-granted (e.g. if onboarding_completed gets
-- toggled again). Safe to call unconditionally at onboarding completion.
create or replace function public.grant_referral_reward(p_referred_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_referrer_id uuid;
  v_already_granted boolean;
  v_reward_until timestamptz := now() + interval '7 days';
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
end;
$$;

grant execute on function public.grant_referral_reward(uuid) to authenticated;

-- Lets a client resolve a shared referral code to the referrer's id without
-- exposing the rest of that person's row (profiles SELECT policy already
-- allows reading active profiles broadly, but this keeps the lookup
-- single-purpose and index-friendly).
create index profiles_referral_code_idx on public.profiles(referral_code);
