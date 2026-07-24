import { useColorScheme } from "react-native";
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
      success: palette.status.success,
      warning: palette.status.warning,
      error: palette.status.error,
    },
    tags: palette.tags,
    spacing,
    radius,
    typography,
    motion,
    shadow,
  };
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return buildTheme(scheme === "dark" ? "dark" : "light");
}
