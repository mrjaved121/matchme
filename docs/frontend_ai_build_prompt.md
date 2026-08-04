# Just Spark — Cloud AI Build Prompt (Frontend UI/UX)

Give this to a cloud AI coding agent (Claude, Cursor, etc.) **together with the exported Stitch
`.zip`**. It is written to make the agent reuse your existing code and work screen-by-screen, so it
spends tokens on building — not on re-discovering the project.

---

## PASTE THIS TO THE AI

You are implementing the UI for **Just Spark**, an existing **React Native + Expo** dating app
(TypeScript, expo-router, Supabase, TanStack Query, Zustand). I will give you a folder of **Stitch
web mockups** (HTML/Tailwind) as the *visual reference only*. Your job is to translate those designs
into the existing Expo codebase — NOT to create a new web app, and NOT to paste HTML.

### Ground rules (read once, then follow for every screen)

1. **This is React Native, not web.** Output `.tsx` React Native components using `View`, `Text`,
   `Pressable`, `Image` (expo-image), `ScrollView`, `FlatList`, etc. Never HTML/CSS/Tailwind.
2. **Reuse the existing design system. Do NOT invent colors or spacing.** Import tokens from
   `theme/tokens.ts` via `useTheme()` (`theme/useTheme.ts`). All colors, spacing, radius,
   typography come from there. The Stitch colors are already represented in these tokens — map to
   them, don't hardcode hex.
3. **Reuse existing components** before writing new ones:
   `components/Button.tsx`, `TextField.tsx`, `ChipSelect.tsx`, `ScreenContainer.tsx`,
   `StateViews.tsx` (loading/empty/error), `SwipeCard.tsx`, `Tag.tsx`, `OnboardingStepLayout.tsx`,
   `ErrorBoundary.tsx`. Extend them if a variant is missing; only create a new component when none fits.
4. **Routing is file-based (expo-router).** Screens live in `app/`. Many already exist
   (`welcome.tsx`, `sign-in.tsx`, `onboarding/*`, `(app)/discover.tsx`, `verify.tsx`, legal, etc.).
   **Match each Stitch screen to the existing route first**; refine that file. Only add a new route
   file when the screen has no home yet, following the existing folder pattern.
5. **Wire data through `lib/`** — `lib/supabase.ts` (client), `lib/queries.ts` (TanStack Query),
   plus feature helpers (`discover.ts`, `referral.ts`, `photoUrl.ts`, etc.). Don't call Supabase
   ad-hoc inside screens; use/extend the query layer.
6. **Every screen must handle states** using `StateViews`: loading (skeleton), empty, and error —
   not just the happy path.
7. **Follow existing conventions**: TypeScript strict, functional components, hooks, the project's
   import style and file naming. Keep diffs small and focused.
8. **Accessibility & platform**: `accessibilityLabel` on icon-only buttons, safe-area handling
   (`react-native-safe-area-context`), haptics via `expo-haptics` on key actions where it fits.

### THEME DECISION (resolve before you start)

`theme/useTheme.ts` currently forces **dark** mode. The product direction is **light-first with a
dark option**. Before implementing, either (a) switch `useTheme()` to return the light scheme (or a
system-driven scheme) and verify screens against the light palette, or (b) confirm the app stays
dark. Do not silently mix. State which you chose in your first message.

### How to work (token-efficient loop — one screen at a time)

For each screen, do exactly this and nothing more:

1. Open **one** Stitch mockup file (the screen you're building).
2. Open the **matching existing route** in `app/` (or decide its new path).
3. Open only the **components/lib you'll actually reuse** for it.
4. Implement/refine the screen in `.tsx`, reusing components and tokens.
5. Wire data via the query layer if the screen shows real data.
6. Add loading/empty/error states.
7. Give me a **1-line summary + the file path(s) changed**, then stop and wait for "next".

Do **not** read the whole repo, restate the design system, or refactor unrelated files. Do **not**
build multiple screens at once unless I say "batch these".

### Suggested build order (do in this order unless I say otherwise)

1. Confirm/adjust theme (light vs dark) + shared components (Button, TextField, Chip, Tag, cards).
2. Auth: welcome → sign-in → phone/OTP → permissions.
3. Onboarding: name → birthdate → gender → looking-for → location → photos → interests → bio → done.
4. Discovery: discover deck → card detail → filters → nearby/online/verified → match animation.
5. Profile + Edit Profile.
6. Matches + Chat (list, conversation, states, report/block).
7. Notifications, Referral, Profile Strength, Verification.
8. Settings, Safety, Legal, system states (empty/loading/error).
9. Dark-mode pass on key screens.

### Deliverable per screen

- The `.tsx` file(s), using existing components + `useTheme()` tokens.
- Reused query/helper wiring where data is shown.
- Loading, empty, and error states.
- A one-line note of what changed. Then wait.

---

## Notes for you (not for the AI)

- **Feed the AI the `.zip` unzipped** into e.g. `C:\projects\matchme\design\`, so it can open one
  screen file at a time. Don't paste all the HTML into chat — that wastes tokens; let it open files.
- **Work in small batches.** Ask for one screen, review the diff, then say "next". This keeps each
  turn cheap and easy to check.
- Because your repo already has the theme, components, routes, and Supabase wiring, most screens are
  a *refinement* job, not a from-scratch build — that's the big token saver.
- If you want, I (this assistant) can be the cloud AI: drop the unzipped design folder in the repo
  and I'll start at step 1.
