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
      success: palette.status.success,
      warning: palette.status.warning,
      error: palette.status.error,
    },
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
