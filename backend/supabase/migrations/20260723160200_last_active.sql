alter table public.profiles
  add column last_active_at timestamptz not null default now();
