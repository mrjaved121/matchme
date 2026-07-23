import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/useTheme";

type Option = { label: string; value: string };

type Props = {
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
};

export function ChipSelect({ options, selected, onToggle }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onToggle(option.value)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: theme.radius.pill,
              borderWidth: 1,
              borderColor: isSelected ? theme.color.primary : theme.color.border,
              backgroundColor: isSelected ? theme.color.primary : theme.color.surface,
            }}
          >
            <Text
              style={[
                theme.typography.subtext,
                { color: isSelected ? "#FFFFFF" : theme.color.textPrimary },
              ]}
            >
              {option.label}
            </Text>
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
