import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { useTheme } from "../theme/useTheme";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = "primary", disabled, loading, style }: Props) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === "primary"
      ? theme.color.primary
      : variant === "danger"
        ? theme.color.error
        : variant === "secondary"
          ? theme.color.surface
          : "transparent";

  const textColor =
    variant === "primary" || variant === "danger" ? "#FFFFFF" : theme.color.primary;

  const borderWidth = variant === "secondary" || variant === "ghost" ? 1 : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor,
          borderWidth,
          borderColor: theme.color.primary,
          borderRadius: theme.radius.pill,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[theme.typography.button, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
