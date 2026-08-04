import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/useTheme";

// Read-only display chip, distinct from ChipSelect (which is for picking).
// Cycles through the theme's tag palette by index so a set of interests
// reads as colorful rather than a wall of identical grey pills.
export function Tag({ label, index, icon }: { label: string; index: number; icon?: keyof typeof Ionicons.glyphMap }) {
  const theme = useTheme();
  const { bg, fg } = theme.tags[index % theme.tags.length];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: bg,
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.smd,
        borderRadius: theme.radius.pill,
      }}
    >
      {icon ? <Ionicons name={icon} size={14} color={fg} /> : null}
      <Text style={[theme.typography.caption, { color: fg, fontWeight: "700" }]}>{label}</Text>
    </View>
  );
}
