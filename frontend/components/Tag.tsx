import { Text, View } from "react-native";
import { useTheme } from "../theme/useTheme";

// Read-only display chip, distinct from ChipSelect (which is for picking).
// Cycles through the theme's tag palette by index so a set of interests
// reads as colorful rather than a wall of identical grey pills.
export function Tag({ label, index }: { label: string; index: number }) {
  const theme = useTheme();
  const { bg, fg } = theme.tags[index % theme.tags.length];

  return (
    <View
      style={{
        backgroundColor: bg,
        paddingVertical: 7,
        paddingHorizontal: 13,
        borderRadius: theme.radius.pill,
      }}
    >
      <Text style={[theme.typography.caption, { color: fg, fontWeight: "700" }]}>{label}</Text>
    </View>
  );
}
