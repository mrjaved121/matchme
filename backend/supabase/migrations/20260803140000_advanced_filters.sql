-- Advanced Filters (Gold-only): consolidates "Verified Users", "Online
-- Users", "Recently Active", "New Members" into toggleable filter criteria
-- rather than 4 separate screens, applied client-side against the existing
-- discover_candidates result set.
alter table public.profiles
  add column filter_verified_only boolean not null default false,
  add column filter_online_only boolean not null default false,
  add column filter_recently_active_only boolean not null default false,
  add column filter_new_members_only boolean not null default false;
