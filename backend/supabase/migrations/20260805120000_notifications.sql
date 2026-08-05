-- In-app notification feed. Populated server-side only (a trigger on new
-- messages here, plus record_swipe on a new match in the next migration) —
-- clients only ever read and mark-as-read their own rows, never insert.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('match', 'message')),
  title text not null,
  body text not null,
  related_match_id uuid references public.matches(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_created_idx on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, update on public.notifications to authenticated;

-- New message -> notify the *other* participant only (never the sender).
create or replace function public.notify_on_new_message()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_match record;
  v_recipient uuid;
  v_sender_name text;
begin
  select * into v_match from public.matches where id = new.match_id;
  v_recipient := case when v_match.user_a_id = new.sender_id then v_match.user_b_id else v_match.user_a_id end;
  select first_name into v_sender_name from public.profiles where id = new.sender_id;

  insert into public.notifications (user_id, type, title, body, related_match_id)
  values (
    v_recipient,
    'message',
    coalesce(v_sender_name, 'Someone') || ' sent you a message',
    left(new.content, 120),
    new.match_id
  );

  return new;
end;
$$;

create trigger messages_notify_on_insert
  after insert on public.messages
  for each row execute function public.notify_on_new_message();
