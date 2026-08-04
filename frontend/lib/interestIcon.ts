import { Ionicons } from "@expo/vector-icons";
import { INTEREST_OPTIONS } from "./constants";

// Matches the export's interest chips, which each carry a small icon (e.g.
// flight_takeoff/Travel, local_cafe/Coffee, hiking/Hiking). Covers the app's
// fixed INTEREST_OPTIONS plus the broader ad-hoc set already present in seed
// data; falls back to a generic tag icon for anything else.
const EXTRA_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  foodie: "restaurant-outline",
  outdoors: "leaf-outline",
  camping: "bonfire-outline",
  design: "color-palette-outline",
  dancing: "musical-notes-outline",
  dogs: "paw-outline",
  cats: "paw-outline",
  swimming: "water-outline",
  volunteering: "heart-outline",
};

const CANONICAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = Object.fromEntries(
  INTEREST_OPTIONS.map((o) => [o.value, o.icon]),
);

export function interestIcon(tag: string): keyof typeof Ionicons.glyphMap {
  const key = tag.toLowerCase();
  return CANONICAL_ICONS[key] ?? EXTRA_ICONS[key] ?? "pricetag-outline";
}
