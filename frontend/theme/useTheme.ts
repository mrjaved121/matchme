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
      online: palette.status.online,
      warning: palette.status.warning,
      error: palette.status.error,
      verified: palette.status.verified,
      verifiedDark: palette.status.verifiedDark,
      // Tinted-background versions of the semantic colors -- for icon
      // medallions (empty states, notification row icons) and warning-card
      // fills. Replaces the `theme.color.x + "1A"` hand-rolled pattern that
      // had drifted to several different alpha values across screens.
      primarySoft: palette.brand.primary + "1A",
      goldSoft: palette.brand.gold + "1A",
      errorSoft: palette.status.error + "18",
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

// Just Spark is a light-first product (matching the Stitch export). The whole
// app renders in light mode; a dark palette exists in tokens.ts for a future
// system-driven dark pass, but light is the deliberate default.
export function useTheme(): Theme {
  return buildTheme("light");
}
