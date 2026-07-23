import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/useTheme";
import { Button } from "./Button";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.center, { gap: theme.spacing.sm }]}>
      <Text style={[theme.typography.title, { color: theme.color.textPrimary, textAlign: "center" }]}>
        {title}
      </Text>
      {description ? (
        <Text
          style={[
            theme.typography.body,
            { color: theme.color.textSecondary, textAlign: "center" },
          ]}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={{ marginTop: theme.spacing.md }} />
      ) : null}
    </View>
  );
}

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ message = "Something went wrong.", onRetry }: ErrorStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.center, { gap: theme.spacing.sm }]}>
      <Text style={[theme.typography.title, { color: theme.color.error, textAlign: "center" }]}>
        {message}
      </Text>
      {onRetry ? (
        <Button
          label="Retry"
          variant="secondary"
          onPress={onRetry}
          style={{ marginTop: theme.spacing.md }}
        />
      ) : null}
    </View>
  );
}

export function LoadingState({ label }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.center, { gap: theme.spacing.sm }]}>
      <ActivityIndicator color={theme.color.primary} size="large" />
      {label ? (
        <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});
