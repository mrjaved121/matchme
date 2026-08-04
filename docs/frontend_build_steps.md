# Just Spark — Cloud AI Build Steps (start here)

Current state: the **theme is already done** — `theme/tokens.ts` + `theme/useTheme.ts` were rebuilt
from the Stitch export (light-first, exact export colors, **no green**, coral primary `#FF5864`,
16/600 buttons). The backend and the `lib/` data layer are working and stay as-is. Your job: build
the UI on top, matching the Stitch designs in `design/stitch_just_spark_ui_kit/`.

Design reference: `C:/projects/matchme/design/stitch_just_spark_ui_kit/` (each screen has
`code.html` + `screen.png`).

---

## PASTE THIS TO THE AI

You are building the frontend UI for **Just Spark** (React Native + Expo, TypeScript, expo-router,
Supabase, TanStack Query, Zustand). The theme is already rebuilt in `theme/` from the Stitch export
(light-first, exact colors, no green). The backend (`backend/`) and data layer (`lib/`) are working —
reuse them, never modify `backend/`. Match the Stitch screens in `design/stitch_just_spark_ui_kit/`
exactly (layout, spacing, colors, copy). Output React Native only — never HTML.

### Fixed rules (apply to every step)

1. Use `useTheme()` for ALL colors, spacing, radius, typography — never hardcode hex in a screen.
2. Reuse the data layer in `lib/` (`supabase.ts`, `queries.ts`, `discover.ts`, etc.) via TanStack
   Query. Extend it only if a screen needs data not yet exposed, same pattern. Never touch `backend/`.
3. Every screen handles loading / empty / error (via `StateViews`) plus the happy path.
4. React Native primitives (`View`, `Text`, `Pressable`, expo-image `Image`, `FlatList`). Translate
   Stitch CSS layout to flexbox.
5. Accessibility: `accessibilityLabel` on icon-only buttons; safe-area on every screen; haptics
   (`expo-haptics`) on swipe/match actions.
6. TypeScript strict, functional components, small focused diffs. Preserve existing route/file names
   (auth deep-links / `auth-callback` depend on them).
7. **Work one item per turn.** Open only the ONE Stitch file + its target route + the components/lib
   you'll reuse. Implement, then reply with a 1-line summary + file paths changed, and STOP. Wait for
   me to say "next". Do not read the whole repo, restate the design system, or batch unless I say so.

### STEP 1 — Core components (do these first, one per turn)

Build/replace these to match the export's "Warm Humanist" component sheet, all reading from
`useTheme()`:
1. `components/Button.tsx` — primary (coral pill, label 16/600), secondary (soft-pink `#FBEAF0`),
   inverted, outlined; loading + disabled states; full-width option.
2. `components/TextField.tsx` — label, input (radius 16), leading icon, password visibility toggle,
   error text.
3. `components/Tag.tsx` + `components/ChipSelect.tsx` — read-only interest chips (cycle the tag
   palette) and selectable chips (single/multi).
4. `components/ScreenContainer.tsx` — safe-area wrapper, screen margin 20, background `#FCF8FF`.
5. `components/StateViews.tsx` — loading skeleton, empty state (illustration + heading + subtext +
   CTA), error state (message + retry).
6. `components/Avatar.tsx` — rounded photo with optional online dot (blue, no green) + verified badge.
7. `components/BottomTabBar.tsx` — Discover · Matches · Chat · Profile, coral active state.
8. `components/SwipeCard.tsx` — photo-first card: name/age, verified badge, distance, bio snippet,
   interest chips; Like/Pass actions.
9. `components/OnboardingStepLayout.tsx` — top progress bar, heading, content slot, Continue button.
After each, tell me it's done and wait.

### STEP 2 — Auth screens (one per turn, in order)

Splash → Welcome/Intro → Login → Sign Up → Phone Login → OTP → Permissions → Forgot Password.
Match `login`, `phone_login`, `otp_verification`, etc. in the export. Wire auth via `lib/`.

### STEP 3 — Onboarding (one per turn)

Name → Birthday → Gender → Looking For → Location → Photos → Interests → Bio → All Set. Use
`OnboardingStepLayout`; persist via the existing onboarding/query helpers in `lib/`.

### STEP 4 — Discovery

Discover deck → Card Detail → Filters → Nearby → Online → Verified → Match Celebration →
Discover "No more people" empty state. Use `SwipeCard`; data via `lib/discover.ts` + queries.

### STEP 5 — Profile & Edit

My Profile → Public Preview → Edit Profile → Edit Photos → Edit Interests → Profile Strength.

### STEP 6 — Matches & Chat

Matches grid → Matches empty state → Conversation list (`messages`) → Chat (`chat_with_marcus`) →
typing / sent-delivered-seen states → send image → chat menu → Report → Block → Messages empty state.

### STEP 7 — Notifications, Referral, Verification

Notifications list → Notification settings → Invite Friends → Share link → Request Verification →
Pending → Verified → Rejected.

### STEP 8 — Settings, Safety, Legal, system states

Settings → Account → Discovery Preferences → Privacy → Safety Center → Blocked Users →
Delete Account → Terms → Privacy Policy → About/Help → shared Empty / Loading / Error templates.

### STEP 9 — Dark-mode pass (last)

Using the dark palette already in `tokens.ts`, add a system-driven dark variant for the key screens:
Discover, Card Detail, Conversation List, Chat, My Profile, Settings.

### Deliverable per turn

The `.tsx` file(s) matching the Stitch design via `useTheme()` tokens, data wired through `lib/`,
loading/empty/error states, and a one-line note of what changed. Then wait for "next".

Begin with **Step 1, component 1 (Button)**. Show me the file, then stop.

---

## Notes for you (not for the AI)

- The design lives at `C:\projects\matchme\design\stitch_just_spark_ui_kit\`; the theme is done.
- Drive it one "next" at a time so each turn is cheap and easy to review.
- I (this assistant) can run these steps directly in your repo — say "start" and I'll build Button first.
