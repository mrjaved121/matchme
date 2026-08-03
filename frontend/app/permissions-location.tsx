import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "../components/ScreenContainer";
import { Button } from "../components/Button";
import { useTheme } from "../theme/useTheme";
import { useAuthStore } from "../store/authStore";
import { captureAndSaveLocation } from "../lib/discover";

export default function PermissionsLocation() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const [loading, setLoading] = useState(false);

  async function handleAllow() {
    setLoading(true);
    await captureAndSaveLocation(myId);
    setLoading(false);
    router.replace("/permissions-notifications");
  }

  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: theme.spacing.md }}>
        <Text style={{ fontSize: 56 }}>📍</Text>
        <Text style={[theme.typography.title, { color: theme.color.textPrimary, textAlign: "center" }]}>
          Find people nearby
        </Text>
        <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center" }]}>
          MatchMe uses your location to show distance and find matches close to you. You can change this anytime in
          Settings.
        </Text>
      </View>

      <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xl }}>
        <Button label="Allow Location" onPress={handleAllow} loading={loading} />
        <Button
          label="Not now"
          variant="ghost"
          onPress={() => router.replace("/permissions-notifications")}
        />
      </View>
    </ScreenContainer>
  );
}
