-- Settings screen additions: discovery display toggles, notification
-- delivery channels (separate dimension from the notify_* event types
-- already in the table), and chat read receipts.
alter table public.profiles
  add column show_distance boolean not null default true,
  add column show_age boolean not null default true,
  add column push_enabled boolean not null default true,
  add column email_enabled boolean not null default false,
  add column read_receipts boolean not null default true;
