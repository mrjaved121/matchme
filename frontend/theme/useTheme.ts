import { palette, radius, shadow, spacing, typography, motion } from "./tokens";

export type Theme = ReturnType<typeof buildTheme>;

function buildTheme(scheme: "light" | "dark") {
  const base = palette[scheme];
  return {
    scheme,
    color: {
      ...base,
      primary: palette.brand.primary,
      primaryDark: palette.brand.primaryDark,
      primaryGradient: [palette.brand.primary, palette.brand.gradientEnd] as const,
      gold: palette.brand.gold,
      goldGradient: [palette.brand.gold, palette.brand.goldGradientEnd] as const,
      success: palette.status.success,
      warning: palette.status.warning,
      error: palette.status.error,
    },
    tags: palette.tags,
    swipe: palette.swipe,
    spacing,
    radius,
    typography,
    motion,
    shadow,
  };
}

// The swipe/discovery UI (card stack, Gold, Boosts) is designed as an
// always-dark experience — same reasoning real swipe apps use: photos read
// better against black, and it's a deliberate brand choice, not a
// light/dark-adaptive one. Light stays in tokens.ts if that ever changes.
export function useTheme(): Theme {
  return buildTheme("dark");
}
