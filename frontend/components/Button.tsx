import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme/useTheme";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  /** Override the label/border color — for a ghost/secondary button sitting on a colored background. */
  textColor?: string;
  /** Override the primary variant's gradient — e.g. Gold's yellow gradient instead of the brand one. */
  gradientColors?: readonly [string, string];
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
  textColor: textColorOverride,
  gradientColors,
}: Props) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === "danger"
      ? theme.color.error
      : variant === "secondary"
        ? theme.color.surface
        : "transparent";

  const textColor =
    textColorOverride ?? (variant === "primary" || variant === "danger" ? "#FFFFFF" : theme.color.primary);

  const borderWidth = variant === "secondary" || variant === "ghost" ? 1 : 0;

  const content = loading ? (
    <ActivityIndicator color={textColor} />
  ) : (
    <Text style={[theme.typography.button, { color: textColor }]}>{label}</Text>
  );

  // The one action that matters per screen gets the brand gradient; every
  // other variant stays a flat fill so the gradient doesn't get diluted.
  if (variant === "primary") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.glow,
          { borderRadius: theme.radius.pill, shadowColor: theme.color.primary, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
          style,
        ]}
      >
        <LinearGradient
          colors={gradientColors ?? theme.color.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, { borderRadius: theme.radius.pill }]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

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
          borderColor: textColorOverride ?? theme.color.primary,
          borderRadius: theme.radius.pill,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {content}
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
  glow: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
});
