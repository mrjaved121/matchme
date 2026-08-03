-- Onboarding module completeness: Languages and Religion don't exist as
-- concepts anywhere yet. Height/Education/Occupation/Orientation columns
-- already exist (added for Edit Profile) — this only adds what's missing.
alter table public.profiles
  add column languages text[] not null default '{}',
  add column religion text;
