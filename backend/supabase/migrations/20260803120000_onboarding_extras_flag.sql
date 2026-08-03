-- About-You/Languages/Religion are all skippable-to-blank onboarding steps,
-- so their own columns being null is ambiguous between "not visited yet"
-- and "visited, chose to skip". This explicit flag disambiguates for
-- resolveOnboardingStep's resume logic.
alter table public.profiles
  add column onboarding_extras_completed boolean not null default false;
