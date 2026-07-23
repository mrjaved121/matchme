import { Text, TextInput, TextInputProps, View } from "react-native";
import { useTheme } from "../theme/useTheme";

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export function TextField({ label, error, style, ...inputProps }: Props) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.xs }}>
      {label ? (
        <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={theme.color.textSecondary}
        style={[
          theme.typography.body,
          {
            color: theme.color.textPrimary,
            backgroundColor: theme.color.surface,
            borderWidth: 1,
            borderColor: error ? theme.color.error : theme.color.border,
            borderRadius: theme.radius.input,
            paddingHorizontal: theme.spacing.md,
            minHeight: 52,
          },
          style,
        ]}
        {...inputProps}
      />
      {error ? (
        <Text style={[theme.typography.caption, { color: theme.color.error }]}>{error}</Text>
      ) : null}
    </View>
  );
}
