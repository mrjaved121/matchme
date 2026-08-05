# Just Spark — Dashboard Chat Inbox (build spec / prompt)

Goal: a real-time chat inbox inside the Next.js **dashboard** so conversations from the mobile app
can be answered from a web console. Two honest roles:

- **Operator** (a real group member): logs in with her own profile account, sees only HER
  conversations, and replies **as herself**. No impersonating profiles she doesn't own.
- **Super-admin** (you): sees EVERY conversation across all operator profiles in real time, gets a
  notification on each new incoming message, and can monitor everything. (Admins already have
  read-access to all messages via RLS.)

This gives the outcome you want — a user messages a profile, the owner replies fast, and you can
watch it all centrally — without the impersonation/legal risk of one console posing as many people.

---

## What already exists (reuse, don't rebuild)

- **Dashboard**: Next.js 16 (App Router), TypeScript, Tailwind v4, `@supabase/ssr`, TanStack Query,
  in `dashboard/`. Admin pages live under `src/app/(admin)/`, gated by `is_admin` in
  `(admin)/layout.tsx`. Supabase clients in `src/lib/supabase/`.
- **Data**: `messages` (match_id, sender_id, content, read_at, created_at), `matches`
  (user_a_id, user_b_id, status), `profiles`. RLS: participants can read+send their messages;
  admins can read all. **Realtime is already enabled** for `public.messages`.
- **Migration done**: `is_operator` flag + `public.is_operator()` helper
  (`20260805120000_operator_inbox.sql`). Apply it, then flag real operators:
  `update public.profiles set is_operator = true where id = '<profile-uuid>';`

## PASTE THIS TO THE AI

Build a real-time chat inbox in the `dashboard/` Next.js app. Reuse the existing Supabase SSR auth,
TanStack Query, and Tailwind setup. Never modify `backend/`. Follow the existing `(admin)` patterns.

### Access & routing
1. New route group `src/app/(inbox)/` with its own `layout.tsx` gated on **`is_admin` OR
   `is_operator`** (mirror the `(admin)/layout.tsx` check; redirect others to `/login`).
2. Add an "Inbox" link to `SidebarNav`. Show a super-admin-only "All conversations" link when
   `is_admin`.

### Operator inbox — `/inbox`
3. **Conversation list**: query the current user's `matches` (where they're user_a or user_b), join
   the other participant's `profiles` (name, primary photo), the last `messages` row, and an unread
   count (messages where `sender_id != me` and `read_at is null`). Sort by latest message. Show
   avatar, name, last-message preview, time, unread badge.
4. **Thread view** `/inbox/[matchId]`: load messages for that match ascending; bubbles (mine right,
   theirs left) with timestamps and read ticks. On open, mark incoming messages read
   (`update messages set read_at = now() where match_id = ? and sender_id != me and read_at is null`).
5. **Reply box**: insert a message with `sender_id = auth.uid()`, `match_id`, `content` (1–2000
   chars). This passes existing RLS because the operator is a participant. Optimistic UI + send on
   Enter.
6. **Realtime**: subscribe to `postgres_changes` on `public.messages` (INSERT) filtered to the
   current match / the user's matches; append new messages live and bump unread counts + list order.

### Super-admin monitoring — `/inbox/all` (is_admin only)
7. **All conversations**: list every active conversation across operator profiles — operator name,
   the other user, last message, unread/needs-reply indicator, time. Realtime so new incoming
   messages appear at the top instantly.
8. **Notifications**: on a new incoming message (from a non-operator user), show an in-app toast and
   fire a browser `Notification` (request permission once). Optionally a title-bar unread count.
9. Super-admin can OPEN any thread read-only for monitoring. Super-admin does NOT send as operators
   (that would be impersonation) — replies come from the operator's own login. If a thread needs an
   answer, it's surfaced to the right operator.

### Rules
- Server components + server actions where possible; TanStack Query for client lists; Supabase
  Realtime for live updates. Use the existing `src/lib/supabase/{server,client,middleware}.ts`.
- Match the dashboard's existing Tailwind styling and components (`StatTile`, `StatusBadge`,
  `SidebarNav`, tables).
- Handle loading / empty / error states. Round all counts. Accessibility on buttons.
- Keep RLS as the security boundary — never use the service role to send as another user.
- Work one piece per turn: build it, report a 1-line summary + file paths, then wait for "next".

### Build order
1. `(inbox)` layout + access gate + SidebarNav link.
2. Operator conversation list (`/inbox`).
3. Thread view + mark-as-read (`/inbox/[matchId]`).
4. Reply box + optimistic send.
5. Realtime for list + thread.
6. Super-admin `/inbox/all` overview.
7. Notifications (toast + browser Notification + unread counters).

Start with build-order item 1, show the files, then stop.

---

## Notes for you (not for the AI)

- Apply the migration first, then flag each real group member's profile with `is_operator = true`.
- Each member replies only to her own conversations; you see everything from `/inbox/all`.
- I (this assistant) can build these steps directly in your repo — say "start" and I'll do item 1.
