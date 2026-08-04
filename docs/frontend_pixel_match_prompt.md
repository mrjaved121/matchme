# Just Spark — Cloud AI Prompt: Replicate Stitch Screens Exactly (Light Theme)

Give this to a cloud AI coding agent. It rebuilds the frontend in React Native to **match the Stitch
designs pixel-for-pixel**, using the **exact colors** from the exported files, wired to the existing
backend.

**Design source:** `C:/projects/matchme/design/stitch_just_spark_ui_kit/` (the unzipped Stitch export).

---

## PASTE THIS TO THE AI

You are rebuilding the **frontend UI** of **Just Spark**, a React Native + Expo dating app
(TypeScript, expo-router, Supabase, TanStack Query, Zustand). The **backend is already built** and
must not change. Your job: **faithfully re-create the Stitch designs** in
`design/stitch_just_spark_ui_kit/` as React Native screens — same layout, same spacing, same copy,
and the **exact light-theme colors** from those files.

### Step 0 — Extract the design system from the export (do this first)

1. Open the files in `design/stitch_just_spark_ui_kit/`. For each screen there is HTML/CSS (Tailwind
   or inline styles). **Read the actual color values** used — background, surface, text, primary
   button, chips, borders, verified/success colors — and collect the exact hex codes.
2. Build `theme/tokens.ts` + `theme/useTheme.ts` from those **exact** values (light theme). Do not
   guess or "improve" the palette — use what the export contains. If the export uses a coral primary
   and warm light surfaces, mirror those precise hexes.
3. Also extract spacing, corner radius, font sizes/weights, and shadows from the export and put them
   in tokens. This becomes the single source of truth so every screen matches.
4. Report the extracted palette + type scale back to me before building screens, so I can confirm.

### KEEP vs REBUILD

- **KEEP / never touch:** `backend/`, Expo config (`package.json`, `app.json`, `eas.json`,
  `tsconfig.json`), `assets/`, native folders, and the **API/data layer in `lib/`** (`supabase.ts`,
  `queries.ts`, `discover.ts`, `referral.ts`, `photoUrl.ts`, `registerPushToken.ts`, etc.). Reuse
  `lib/` for all data; extend it only if a screen needs data not yet exposed (same TanStack Query
  pattern).
- **REBUILD from the export:** `theme/`, `components/`, and all `app/` screens.
- Learn the backend/data contract from `lib/` and `backend/supabase/migrations/` before deleting old
  UI. Preserve route/file names that auth deep-links and callbacks depend on (`lib/authDeepLink.ts`,
  `app.json` scheme, `auth-callback`).

### Ground rules

1. React Native only (`View`, `Text`, `Pressable`, expo-image `Image`, `FlatList`…). Never HTML/CSS
   — translate the Stitch layout into RN equivalents (flex, not CSS grid).
2. **Match the design exactly:** same visual hierarchy, spacing, colors (exact hex from Step 0),
   button styles, iconography, and text copy as each Stitch screen.
3. All colors/spacing come from `useTheme()` tokens — no hardcoded hex inside screens.
4. Build reusable components first: `Button`, `TextField`, `ChipSelect`, `Tag`, `ScreenContainer`,
   `StateViews` (loading/empty/error), `SwipeCard`, `OnboardingStepLayout`, `Avatar`, `BottomTabBar`,
   `ErrorBoundary`.
5. Data through `lib/` (TanStack Query → Supabase). No ad-hoc backend calls in screens.
6. Every screen handles loading / empty / error via `StateViews`, plus the happy path.
7. Accessibility: `accessibilityLabel` on icon-only buttons; safe-area on every screen; haptics on
   swipe/match actions.
8. TypeScript strict, functional components, small focused diffs.

### Token-efficient loop (one screen per turn)

Per screen: open the ONE matching Stitch file + the target `app/` route + only the components/lib
you'll reuse → build the `.tsx` to match the design → wire data via `lib/` → add loading/empty/error
→ report a 1-line summary + file paths, then stop and wait for "next". Do not read the whole repo,
restate the design system, or build multiple screens at once unless I say "batch".

### Build order

1. Step 0 (extract palette) → new `theme/` → core components. Confirm they render before screens.
2. Auth → 3. Onboarding → 4. Discovery (deck, detail, filters, match) → 5. Profile + Edit →
   6. Matches + Chat → 7. Notifications, Referral, Profile Strength, Verification →
   8. Settings, Safety, Legal, system states → 9. Dark-mode pass on key screens.

### Deliverable per screen

The `.tsx` file(s) matching the Stitch design using `useTheme()` tokens, data wired via `lib/`,
loading/empty/error states, one-line change note. Then wait.

Start with **Step 0**: extract and report the exact colors + type scale from
`design/stitch_just_spark_ui_kit/`, propose `theme/tokens.ts`, and wait for my approval before
touching screens.

---

## Notes for you (not for the AI)

- Put the unzipped export at `C:\projects\matchme\design\stitch_just_spark_ui_kit\` so the AI can
  read the exact styles. (In Downloads it is not reachable.)
- Work one screen at a time; review each, then say "next".
- Because the export carries the real colors, the AI should pull the palette from it — not from any
  earlier guessed values.
