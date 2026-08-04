// Design tokens — single source of truth for color / spacing / type so every
// screen stays visually consistent.
//
// Palette extracted verbatim from the Just Spark Stitch export
// (design/stitch_just_spark_ui_kit, cross-checked across all screens). Light
// theme is the product default. NO green anywhere — matching the export, which
// conveys positive / verified states with its tertiary blue (#2F96F7) and
// coral/gold, not green. Primary button label is 16/600 (the export tagged
// buttons label-md 14/600, which reads small on a full-width pill CTA).
export const palette = {
  light: {
    background: "#FCF8FF",
    surface: "#FFFFFF",
    surfaceSecondary: "#FBEAF0",
    // "surface-container-low" in the export — the fill for input boxes,
    // distinct from card white.
    inputFill: "#F5F2FF",
    textPrimary: "#1A1A2E",
    textSecondary: "#675B60",
    border: "#E2BEBD",
    // "outline" in the export — muted icon color for neutral secondary
    // buttons (e.g. the Rewind action), distinct from body text-secondary.
    outline: "#8E706F",
    // "surface-variant" — progress-bar track color, a shade darker than
    // surfaceSecondary/inputFill.
    surfaceVariant: "#E2E0FC",
  },
  dark: {
    background: "#141019",
    surface: "#1E1A24",
    surfaceSecondary: "#2A222A",
    // No dark variant in the export — derived to sit one step lighter than
    // dark surface, mirroring the light theme's input-vs-card relationship.
    inputFill: "#26202D",
    textPrimary: "#F5F3F2",
    textSecondary: "#A99BA1",
    border: "#3A2E33",
    outline: "#9C8B85",
    surfaceVariant: "#332B39",
  },
  brand: {
    primary: "#FF5864",
    primaryDark: "#B62135",
    gradientEnd: "#FF7A84",
    gold: "#FFD166",
    goldGradientEnd: "#FFE1A3",
  },
  // No green. The "online" dot is the export's primary coral (confirmed on
  // the messages screen's avatar strip: bg-primary, white ring). Verified
  // uses tertiary blue. Premium uses gold; errors use the export's error red.
  status: {
    success: "#2F96F7",
    online: "#FF5864",
    warning: "#F5A623",
    error: "#BA1A1A",
    verified: "#2F96F7",
    verifiedDark: "#0060A8",
  },
  // Icon colors for the discover action row, confirmed against the export's
  // discover screen markup: rewind = outline, pass = error, superlike =
  // tertiary-container, like = primary-container (filled), boost = primary
  // (the darker token, not primary-container).
  swipe: {
    rewind: "#8E706F",
    pass: "#BA1A1A",
    superlike: "#2F96F7",
    like: "#FF5864",
    boost: "#B62135",
  },
  // Read-only interest chips cycle through these — all hexes from the export's
  // soft container palette.
  tags: [
    { bg: "#FBEAF0", fg: "#B62135" },
    { bg: "#FFDAD9", fg: "#93000A" },
    { bg: "#E8E5FF", fg: "#2F2E43" },
    { bg: "#D3E4FF", fg: "#004880" },
    { bg: "#EFDEE4", fg: "#5A4040" },
  ],
};

// Extracted scale: 4 / 8 / 12 / 16 / 24 / 32, mobile screen margin 20.
export const spacing = {
  xs: 4,
  sm: 8,
  smd: 12,
  md: 16,
  screen: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Cards 24, inputs 16, buttons full pill.
export const radius = {
  input: 16,
  card: 24,
  pill: 999,
};

// Inter. Roles map to the export's type scale.
export const typography = {
  displayLg: { fontSize: 40, fontWeight: "700" as const, lineHeight: 48 },
  display: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
  title: { fontSize: 24, fontWeight: "600" as const, lineHeight: 30 },
  bodyLg: { fontSize: 18, fontWeight: "400" as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
  subtext: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: "600" as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: "400" as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: "600" as const, lineHeight: 22 },
};

export const motion = {
  fast: 150,
  base: 200,
};

export const shadow = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  floating: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
};
