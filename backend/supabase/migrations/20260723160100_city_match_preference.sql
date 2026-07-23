-- Opt-in flag for the preference filter sheet: when set, only match against
-- candidates in the same city (already collected on profiles.city). Off by
-- default so existing matching behavior is unaffected until a user
-- explicitly narrows their pool.
alter table public.profiles
  add column prefer_same_city boolean not null default false;
