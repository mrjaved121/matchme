import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme/useTheme";

// "ghost" renders identically to the export's "outlined" button (transparent +
// border) — kept under its existing name since it's used in 17 screens, rather
// than a repo-wide rename for a vocabulary difference with no visual change.
type Variant = "primary" | "secondary" | "inverted" | "ghost" | "danger";

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
  /** Stretch to the width of its container instead of hugging its label. */
  fullWidth?: boolean;
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
  fullWidth,
}: Props) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === "danger"
      ? theme.color.error
      : variant === "secondary"
        ? theme.color.surfaceSecondary
        : variant === "inverted"
          ? theme.color.surface
          : "transparent";

  const textColor =
    textColorOverride ??
    (variant === "primary" || variant === "danger"
      ? "#FFFFFF"
      : theme.color.primary);

  const borderWidth = variant === "ghost" ? 1 : 0;

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
          {
            borderRadius: theme.radius.pill,
            shadowColor: theme.color.primary,
            opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
            width: fullWidth ? "100%" : undefined,
          },
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
          width: fullWidth ? "100%" : undefined,
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
