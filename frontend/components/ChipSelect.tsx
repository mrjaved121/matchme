import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/useTheme";

type Option = { label: string; value: string; icon?: keyof typeof Ionicons.glyphMap };

type Props = {
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
};

// Unselected/selected fills and the no-border treatment are taken directly
// from the export's onboarding_interests chip (bg-surface-container /
// bg-primary-container, no border in either state).
export function ChipSelect({ options, selected, onToggle }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        const color = isSelected ? "#FFFFFF" : theme.color.textPrimary;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onToggle(option.value)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.xs,
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.radius.pill,
              backgroundColor: isSelected ? theme.color.primary : theme.color.inputFill,
            }}
          >
            {option.icon ? <Ionicons name={option.icon} size={18} color={color} /> : null}
            <Text style={[theme.typography.body, { color }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});
