import { useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/useTheme";

type Props = TextInputProps & {
  label?: string;
  error?: string;
  /** Icon shown at the field's leading edge — e.g. "mail-outline", "lock-closed-outline". */
  leadingIcon?: keyof typeof Ionicons.glyphMap;
};

export function TextField({ label, error, leadingIcon, style, secureTextEntry, ...inputProps }: Props) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isPassword = !!secureTextEntry;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      {label ? (
        <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.color.inputFill,
          borderRadius: theme.radius.input,
          borderWidth: error ? 1 : focused ? 2 : 0,
          borderColor: error ? theme.color.error : theme.color.primary,
          minHeight: 56,
          paddingHorizontal: theme.spacing.md,
          gap: theme.spacing.sm,
        }}
      >
        {leadingIcon ? <Ionicons name={leadingIcon} size={20} color={theme.color.textSecondary} /> : null}
        <TextInput
          placeholderTextColor={theme.color.textSecondary}
          secureTextEntry={isPassword && !revealed}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          style={[theme.typography.body, { flex: 1, color: theme.color.textPrimary, paddingVertical: theme.spacing.sm }, style]}
          {...inputProps}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            onPress={() => setRevealed((v) => !v)}
            hitSlop={8}
          >
            <Ionicons name={revealed ? "eye-off-outline" : "eye-outline"} size={20} color={theme.color.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={[theme.typography.caption, { color: theme.color.error }]}>{error}</Text>
      ) : null}
    </View>
  );
}
