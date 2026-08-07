-- registerPushToken() has always been real (requests permission, stores a
-- token in push_tokens) but nothing ever actually sent a push -- the
-- notifications table only ever drove the in-app bell, which is useless
-- for "someone messaged me while my phone was locked". This wires up the
-- other half: on every new notification row, fire an async HTTP call to
-- Expo's push API for each of that user's registered devices.
--
-- pg_net makes this a fire-and-forget async call from the trigger itself
-- (no edge function to deploy/maintain) -- the standard Supabase pattern
-- for exactly this. Silent no-op for a user with zero registered tokens
-- (e.g. anyone who has only ever used Expo Go, where registration is a
-- deliberate no-op -- see registerPushToken.ts).
create extension if not exists pg_net;

create or replace function public.send_push_on_notification()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_token record;
begin
  for v_token in
    select token from public.push_tokens where profile_id = new.user_id
  loop
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := jsonb_build_object(
        'to', v_token.token,
        'title', new.title,
        'body', new.body,
        'data', jsonb_build_object('type', new.type, 'related_match_id', new.related_match_id)
      ),
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json')
    );
  end loop;

  return new;
end;
$$;

create trigger notifications_send_push
  after insert on public.notifications
  for each row execute function public.send_push_on_notification();
