import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "../components/ScreenContainer";
import { Button } from "../components/Button";
import { useTheme } from "../theme/useTheme";
import { useAuthStore } from "../store/authStore";
import { registerPushToken } from "../lib/registerPushToken";

export default function PermissionsNotifications() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const [loading, setLoading] = useState(false);

  async function finish() {
    router.replace("/(app)/discover");
  }

  async function handleAllow() {
    setLoading(true);
    await registerPushToken(myId).catch(() => {});
    setLoading(false);
    finish();
  }

  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: theme.spacing.md }}>
        <Text style={{ fontSize: 56 }}>🔔</Text>
        <Text style={[theme.typography.title, { color: theme.color.textPrimary, textAlign: "center" }]}>
          Never miss a match
        </Text>
        <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center" }]}>
          Get notified about new matches and messages. You can change this anytime in Settings.
        </Text>
      </View>

      <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xl }}>
        <Button label="Allow Notifications" onPress={handleAllow} loading={loading} />
        <Button label="Not now" variant="ghost" onPress={finish} />
      </View>
    </ScreenContainer>
  );
}
