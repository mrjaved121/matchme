// Design tokens per docs/product-prompt.md §2. Keep this the single source
// of truth for color/spacing/type so every screen stays visually consistent.

export const palette = {
  light: {
    background: "#FAFAFA",
    surface: "#FFFFFF",
    textPrimary: "#1A1A1A",
    textSecondary: "#6B6B6B",
    border: "#E5E5E5",
  },
  dark: {
    background: "#121212",
    surface: "#1E1E1E",
    textPrimary: "#F5F5F5",
    textSecondary: "#A0A0A0",
    border: "#2C2C2C",
  },
  brand: {
    primary: "#FF4D6D",
    primaryDark: "#E63E5C",
  },
  status: {
    success: "#2ECC71",
    warning: "#F5A623",
    error: "#E74C3C",
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  input: 12,
  card: 16,
  pill: 999,
};

export const typography = {
  display: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
  title: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  body: { fontSize: 17, fontWeight: "400" as const, lineHeight: 24 },
  subtext: { fontSize: 15, fontWeight: "400" as const, lineHeight: 20 },
  caption: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  button: { fontSize: 17, fontWeight: "700" as const, lineHeight: 22 },
};

export const motion = {
  fast: 150,
  base: 200,
};

export const shadow = {
  floating: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
};
