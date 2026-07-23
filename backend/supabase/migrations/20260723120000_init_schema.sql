-- MatchMe initial schema: profiles, photos, queue, date sessions, decisions,
-- matches, messages, reports, blocks, push tokens.

create extension if not exists "pgcrypto";

-- ============ PROFILES ============
-- Created automatically (see handle_new_user trigger below) when a user signs
-- up via Supabase Auth. Core fields start null and are filled by the
-- onboarding wizard, which flips onboarding_completed to true.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  birthdate date,
  gender text check (gender in ('male', 'female', 'nonbinary', 'other')),
  interested_in text[] not null default '{}',
  bio text not null default '',
  city text,
  interest_tags text[] not null default '{}',
  min_age_pref integer not null default 18,
  max_age_pref integer not null default 99,
  max_distance_km integer not null default 50,
  is_verified boolean not null default false,
  is_admin boolean not null default false,
  onboarding_completed boolean not null default false,
  status text not null default 'active' check (status in ('active', 'paused', 'suspended', 'banned')),
  notify_matches boolean not null default true,
  notify_messages boolean not null default true,
  notify_marketing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint birthdate_min_age check (birthdate is null or birthdate <= (current_date - interval '18 years')),
  constraint age_pref_range check (min_age_pref >= 18 and max_age_pref >= min_age_pref),
  constraint interested_in_valid check (interested_in <@ array['male', 'female', 'nonbinary', 'other']::text[])
);

create index profiles_status_idx on public.profiles(status);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ PROFILE PHOTOS ============
create table public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (profile_id, position)
);

create index profile_photos_profile_id_idx on public.profile_photos(profile_id);

-- ============ SPEED DATING QUEUE ============
-- One row per user currently waiting for a match. Deleted on match or cancel.
create table public.speed_dating_queue (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now()
);

-- ============ DATE SESSIONS ============
create table public.date_sessions (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  room_name text not null unique,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  duration_seconds integer not null default 240,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  constraint date_sessions_different_users check (user_a_id <> user_b_id)
);

create index date_sessions_user_a_idx on public.date_sessions(user_a_id);
create index date_sessions_user_b_idx on public.date_sessions(user_b_id);

-- ============ DATE DECISIONS ============
-- Private "yes/no" each participant submits at the end of a session.
create table public.date_decisions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.date_sessions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  decision text not null check (decision in ('yes', 'no')),
  created_at timestamptz not null default now(),
  unique (session_id, profile_id)
);

-- ============ MATCHES ============
-- Created when both participants of a session decide "yes".
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.date_sessions(id) on delete cascade,
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'unmatched')),
  matched_at timestamptz not null default now(),
  constraint matches_different_users check (user_a_id <> user_b_id)
);

create index matches_user_a_idx on public.matches(user_a_id);
create index matches_user_b_idx on public.matches(user_b_id);

-- ============ MESSAGES ============
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_match_id_created_idx on public.messages(match_id, created_at);

-- ============ REPORTS ============
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.date_sessions(id) on delete set null,
  match_id uuid references public.matches(id) on delete set null,
  reason text not null check (reason in ('inappropriate_behavior', 'fake_profile', 'harassment', 'nudity', 'spam', 'other')),
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'actioned', 'dismissed')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint reports_different_users check (reporter_id <> reported_id)
);

create index reports_status_idx on public.reports(status);

-- ============ BLOCKS ============
create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_different_users check (blocker_id <> blocked_id)
);

-- ============ PUSH TOKENS ============
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now()
);

create index push_tokens_profile_id_idx on public.push_tokens(profile_id);

-- ============ STORAGE: profile photos bucket ============
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;
