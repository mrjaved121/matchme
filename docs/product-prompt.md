# MatchMe — Full Product & UI/UX Prompt

Use this as a single spec to hand to a designer, paste into an AI UI generator (v0, Lovable, Bolt, Figma AI), or use directly to drive implementation in this repo (`frontend/` = Expo React Native, `dashboard/` = Next.js, `backend/` = Supabase).

---

## 1. Product Summary

Design and build **MatchMe**, a mobile speed-dating app. Users join a live queue and get matched into short, timed 1:1 text-chat "dates" (3–5 minutes) — no audio/video calling. At the end of each date, both people privately decide "Yes" or "Continue" / "No" — a mutual yes unlocks ongoing text chat. The app must feel **fast, light, and low-friction**: minimal steps between opening the app and being in a date, minimal decisions per screen, no clutter.

**Tone:** professional and trustworthy, not gimmicky or overly playful. Think "clean fintech-grade polish" applied to dating, not "cartoon swipe app."

---

## 2. Visual Design Direction

- **Style:** clean, modern, minimal. Generous whitespace, one clear primary action per screen, no visual noise.
- **Color palette** (light mode primary, dark mode supported):
  - Primary: `#FF4D6D` (warm coral — energetic but not garish, used sparingly for primary actions/CTAs)
  - Primary dark (for dark mode / pressed states): `#E63E5C`
  - Neutral background: `#FAFAFA` (light) / `#121212` (dark)
  - Surface/card: `#FFFFFF` (light) / `#1E1E1E` (dark)
  - Text primary: `#1A1A1A` (light) / `#F5F5F5` (dark)
  - Text secondary: `#6B6B6B` (light) / `#A0A0A0` (dark)
  - Success: `#2ECC71` · Warning: `#F5A623` · Error: `#E74C3C`
  - Borders/dividers: `#E5E5E5` (light) / `#2C2C2C` (dark)
- **Typography:** Inter (or system font fallback for speed — avoid loading heavy custom fonts on first launch). Type scale: 28/22/17/15/13px for display/title/body/subtext/caption. Bold weights only for headlines and CTAs, regular elsewhere.
- **Shape language:** 16px corner radius on cards and buttons, 12px on inputs, full-round on avatars and pill buttons.
- **Elevation:** flat design with a single soft shadow tier for floating elements (chat controls, modals). Avoid heavy skeuomorphism.
- **Motion:** fast and purposeful — 150–200ms transitions, no decorative animation that adds perceived latency. Use skeleton loaders (not spinners) for anything over 300ms.
- **States required on every screen:** loading (skeleton), empty, error (with retry), and populated. Never ship a screen without all four.
- **Accessibility:** minimum 4.5:1 text contrast, 44x44pt minimum tap targets, dynamic type support, all interactive elements labeled for screen readers.

---

## 3. Mobile App Features (`frontend/`)

### 3.1 Onboarding & Auth
- Splash screen → phone number or email entry → OTP verification (Supabase Auth)
- First-time profile setup wizard (single flow, one question per screen, progress bar):
  - Name, birthdate (18+ enforced), gender, dating preference
  - Profile photos (min 1, max 6, with in-app crop)
  - Short bio (prompt-based, e.g. "Two truths and a lie")
  - Interest tags (multi-select chips)
  - Location permission (city-level only, not precise GPS)

### 3.2 Profile Verification & Safety
- Optional selfie-photo verification (liveness check against profile photo) — badge shown on verified profiles
- Community guidelines acceptance on signup

### 3.3 Discovery / Speed-Dating Queue
- Home screen: single prominent "Start Speed Dating" CTA
- Preference filter (age range, gender, distance) accessible before joining queue
- Live queue screen: waiting-for-match state with estimated wait time, cancel option
- Instant match found → 3-second "get ready" transition screen showing the other person's first name + photo blurred until call starts

### 3.4 Live Date Session
- Timed 1:1 text chat (real-time via Supabase Realtime), scoped to the session — separate from the ongoing match chat:
  - Visible countdown timer (e.g., 4:00 minute round) in the header
  - "End date now" control to leave early
  - Optional icebreaker prompt overlay to reduce awkward silence
- No audio/video calling — deliberately out of scope

### 3.5 Post-Date Decision
- Immediately after the timed chat ends: private full-screen "Yes / No" decision screen (other user cannot see your choice)
- If mutual yes → match confirmation screen + chat unlocked
- If not mutual → polite "keep looking" screen, back to queue

### 3.6 Matches & Chat
- Matches list (most recent first, unread indicator)
- 1:1 text chat (real-time via Supabase Realtime), read receipts optional, typing indicator
- Ability to unmatch or report from within a chat

### 3.7 Notifications
- Push notifications (Expo Notifications): match found, new message, "come back and date" re-engagement nudge
- In-app notification preferences toggle per category

### 3.8 Safety & Trust
- Report user (with reason categories) and block, available from profile, chat, and post-date screens
- Instant block ends any active session immediately

### 3.9 Settings & Account
- Edit profile / photos / preferences
- Notification settings
- Privacy settings (who can see profile, pause account)
- Delete account (must be self-serve, not support-ticket-only)
- Logout

---

## 4. Admin Dashboard Features (`dashboard/`)

- Auth-gated (`is_admin` flag) login using the same Supabase project
- **User management:** search/view users, suspend/ban, view verification status
- **Moderation queue:** review reported users/photos with the report reason, approve/reject/ban actions
- **Live metrics:** signups over time, active users, chat-dates started vs. completed, match rate, average queue wait time
- **Content review:** flagged profile photos pending manual approval (optional for v1 — can start manual via Supabase Studio and graduate into this dashboard)

---

## 5. Screen List (mobile)

1. Splash
2. Phone/Email entry
3. OTP verification
4. Profile setup wizard (multi-step)
5. Photo verification (optional step)
6. Home / Start Date CTA
7. Preference filter sheet
8. Queue / waiting screen
9. Match-found transition
10. Live timed chat date screen
11. Post-date decision screen
12. Match confirmation screen
13. Matches list
14. Chat screen
15. Profile view (own + others')
16. Edit profile
17. Settings
18. Report/Block flow
19. Notification preferences

---

## 6. Non-Functional Requirements

- Cold start to interactive home screen: target under 2 seconds
- All lists virtualized (FlashList/FlatList), no unbounded renders
- Optimistic UI for chat sends and Yes/No decisions — don't block on network round-trip
- Offline/poor-connection handling: clear "reconnecting…" state during a live chat date rather than a silent freeze
- No screen ships without loading/empty/error states (see §2)

---

## 7. Grounding / Tech Constraints

Keep any generated UI code compatible with the existing stack:
- Mobile: Expo (managed) + React Native + TypeScript, Expo Router for navigation
- State: Zustand (client) + TanStack Query (server state against Supabase)
- Backend: Supabase (Postgres, Auth, Realtime, Storage, Edge Functions) — no custom server
- No audio/video calling SDK — the timed date is text chat only, via Supabase Realtime
- Dashboard: Next.js (App Router) + TypeScript + Tailwind
