# Just Spark — Cloud AI Prompt: Rebuild Frontend From Scratch (Light Theme)

Give this to a cloud AI coding agent **together with the exported Stitch `.zip`** (unzipped into
`C:\projects\matchme\design\`). Goal: build a **fresh, light-theme React Native (Expo) frontend from
scratch**, removing the old dark-theme UI, while **reusing the existing backend and its API layer**.

---

## PASTE THIS TO THE AI

You are rebuilding the **frontend UI** of **Just Spark**, a React Native + Expo dating app
(TypeScript, expo-router, Supabase, TanStack Query, Zustand). The **backend is already built and
working** (Supabase: tables, RLS, edge functions) and must NOT be changed. You are rebuilding the
presentation layer from scratch with a new **light-first** design, using the provided Stitch web
mockups (in `design/`) as the **visual reference only** (they are HTML — you output React Native).

### KEEP vs REBUILD (do not blur this line)

**KEEP / REUSE — do not rewrite:**
- The Expo project config: `package.json`, `app.json`, `eas.json`, `tsconfig.json`, `assets/`,
  `android/`, native config, and all installed dependencies.
- The **backend**: everything in `backend/` (Supabase migrations, edge functions). Never modify.
- The **data/API layer** in `lib/` — `supabase.ts`, `queries.ts`, `discover.ts`, `referral.ts`,
  `photoUrl.ts`, `registerPushToken.ts`, `useDateSession.ts`, `useIsOnline.ts`, `constants.ts`,
  `onboardingProgress.ts`, `authDeepLink.ts`, `legalContent.ts`, `formatRelativeActive.ts`.
  These are your contract to the backend — reuse them. Extend/add functions only if a screen needs
  data not yet exposed, and follow the same TanStack Query pattern.

**REBUILD FROM SCRATCH:**
- `theme/` — replace with a new **light-first** design system (see below).
- `components/` — build a fresh reusable component library.
- `app/` — rebuild all screens (expo-router file-based routes) with the new design.

Before deleting old UI: first learn the backend contract by reading `lib/` and the table shapes in
`backend/supabase/migrations/`. Then remove the old dark-theme `theme/`, `components/`, and `app/`
screens and rebuild. Keep the route/file names that the app's navigation and deep links depend on
(check `lib/authDeepLink.ts`, `app.json` scheme, and existing `_layout.tsx` structure) so backend
callbacks (e.g. auth redirect, `auth-callback`) still resolve.

### NEW DESIGN SYSTEM (light-first)

Create `theme/tokens.ts` + `theme/useTheme.ts` fresh:
- **Light default, dark supported.** `useTheme()` returns light by default (or system scheme) — do
  NOT force dark like the old build did.
- **Brand — Just Spark:** primary coral `#FF4D6D` with a warm coral→peach gradient
  (`#FF4D6D → #FF8A5B`), gold accent `#F0B429`, verified blue `#3B82F6`, success green `#2E9C7B`.
- **Light surfaces:** background `#FBF3EE` (warm blush) / `#F7F7FA`, surface `#FFFFFF`, text primary
  `#2B1B1F`, text secondary `#8C7178`, border `#F0DDD5`.
- **Dark surfaces:** background `#0C0C10` / `#18181E`, text `#F5F3F2`, keep coral + blue vivid.
- Tokens for spacing, radius (16–24px cards, pill buttons), typography scale, shadows, motion.
- Every component reads from `useTheme()` — never hardcode hex in a screen.

### CORE COMPONENTS (build these first, reuse everywhere)

`Button` (primary coral / secondary / ghost), `TextField`, `ChipSelect` + `Tag`, `ScreenContainer`
(safe-area wrapper), `StateViews` (loading skeleton / empty / error), `SwipeCard`,
`OnboardingStepLayout` (progress bar + heading + Continue), `Avatar`, `BottomTabBar`
(Discover · Matches · Chat · Profile), `ErrorBoundary`.

### GROUND RULES

1. React Native only — `View`, `Text`, `Pressable`, expo-image `Image`, `FlatList`, etc. No HTML/CSS.
2. TypeScript strict, functional components + hooks. Match the project's existing style.
3. All data through the `lib/` query layer (TanStack Query) → Supabase. No ad-hoc backend calls in
   screens. Never touch `backend/`.
4. Every screen handles **loading / empty / error** via `StateViews`, plus the happy path.
5. Accessibility: `accessibilityLabel` on icon-only buttons; safe-area on every screen; haptics
   (`expo-haptics`) on swipe/match actions.
6. Keep diffs focused; build one screen per turn.

### TOKEN-EFFICIENT WORK LOOP (one screen per turn)

For each screen: open ONE Stitch mockup in `design/` + the target route file + only the
components/lib you'll reuse → implement the `.tsx` → wire data via `lib/` → add loading/empty/error →
report **1-line summary + file paths changed**, then stop and wait for "next". Do not read the whole
repo, restate the design system, or build multiple screens at once unless I say "batch".

### BUILD ORDER

1. New `theme/` (light) + core components above. Confirm they render before screens.
2. Auth: splash → welcome/intro → sign-in → phone/OTP → permissions → forgot password.
3. Onboarding: name → birthdate → gender → looking-for → location → photos → interests → bio → done.
4. Discovery: discover deck → card detail → filters → nearby/online/verified → match animation.
5. Profile + Edit Profile.
6. Matches + Chat (list, conversation, typing, status, send image, report/block, empty states).
7. Notifications, Referral, Profile Strength, Verification (manual).
8. Settings, Safety, Legal, system states.
9. Dark-mode pass on key screens (Discover, Card Detail, Chat, Conversation List, Profile, Settings).

### DELIVERABLE PER SCREEN

The `.tsx` file(s) using new components + `useTheme()` tokens, data wired through `lib/`,
loading/empty/error states, and a one-line change note. Then wait for "next".

Start by reading `lib/` and `backend/supabase/migrations/` to learn the API/data contract, then
propose the new `theme/tokens.ts` and the first components. Wait for my approval before deleting old
UI.

---

## Notes for you (not for the AI)

- Unzip the Stitch export into `C:\projects\matchme\design\` so the AI opens one screen at a time.
- Work in small batches: ask for one screen, review, say "next". Cheap turns, easy to verify.
- The safest sequence is: build the new `theme/` + components, confirm they render, THEN delete the
  old `app/`/`components/`/`theme/` screen by screen as you replace them — so the app never fully
  breaks mid-rebuild.
- Do not let it touch `backend/` or rewrite `lib/` — that's your working API layer.
- I (this assistant) can act as the cloud AI: drop the unzipped `design/` folder in the repo and say
  go, and I'll start with the theme + core components.
