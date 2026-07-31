import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";

const ROWS: {
  label: string;
  href:
    | "/(app)/settings/notifications"
    | "/(app)/settings/privacy"
    | "/(app)/settings/verification"
    | "/(app)/settings/blocked"
    | "/(app)/settings/safety"
    | "/(app)/settings/subscription"
    | "/(app)/settings/help";
}[] = [
  { label: "Get verified", href: "/(app)/settings/verification" },
  { label: "🔔  Notifications", href: "/(app)/settings/notifications" },
  { label: "🛡️  Safety Center", href: "/(app)/settings/safety" },
  { label: "💳  Manage Subscription", href: "/(app)/settings/subscription" },
  { label: "❓  Help & Support", href: "/(app)/settings/help" },
  { label: "Blocked users", href: "/(app)/settings/blocked" },
  { label: "Privacy & account", href: "/(app)/settings/privacy" },
];

export default function Settings() {
  const theme = useTheme();

  return (
    <ScreenContainer>
      <Text
        style={[theme.typography.title, { color: theme.color.textPrimary, marginTop: theme.spacing.md, marginBottom: theme.spacing.md }]}
      >
        Settings
      </Text>

      <View style={{ gap: theme.spacing.sm }}>
        {ROWS.map((row) => (
          <Pressable
            key={row.href}
            onPress={() => router.push(row.href)}
            style={{
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.md,
              backgroundColor: theme.color.surface,
              borderRadius: theme.radius.card,
              borderWidth: 1,
              borderColor: theme.color.border,
            }}
          >
            <Text style={[theme.typography.body, { color: theme.color.textPrimary }]}>{row.label}</Text>
          </Pressable>
        ))}
      </View>

      <Button
        label="Log out"
        variant="secondary"
        onPress={() => supabase.auth.signOut()}
        style={{ marginTop: theme.spacing.xl }}
      />
    </ScreenContainer>
  );
}
