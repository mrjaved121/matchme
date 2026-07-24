// Design tokens per docs/product-prompt.md §2. Keep this the single source
// of truth for color/spacing/type so every screen stays visually consistent.

// "Warm Signal" — same structure as the original spec, warmer skin: a warm
// blush ground instead of stark white/near-black, a coral→peach gradient on
// the one action that matters per screen, and a warmer success green.
export const palette = {
  light: {
    background: "#FBF3EE",
    surface: "#FFFFFF",
    textPrimary: "#2B1B1F",
    textSecondary: "#8C7178",
    border: "#F0DDD5",
  },
  dark: {
    background: "#1C1210",
    surface: "#241815",
    textPrimary: "#F5ECE8",
    textSecondary: "#B5A29C",
    border: "#3A2A24",
  },
  brand: {
    primary: "#FF4D6D",
    primaryDark: "#E63E5C",
    gradientEnd: "#FF8A5B",
  },
  status: {
    success: "#2E9C7B",
    warning: "#F5A623",
    error: "#E74C3C",
  },
  // Read-only tag chips (e.g. interest tags on a profile) cycle through
  // these — distinct from the single brand accent used for actions.
  tags: [
    { bg: "#FFE0D6", fg: "#C2402F" },
    { bg: "#E4F5EE", fg: "#2E9C7B" },
    { bg: "#FDE8C9", fg: "#A66A0B" },
    { bg: "#F1E3FA", fg: "#7A44B3" },
    { bg: "#DCEBFB", fg: "#2B6CB0" },
  ],
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
  card: 20,
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
