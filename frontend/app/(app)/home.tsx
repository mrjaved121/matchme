import { Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme/useTheme";
import { useAuthStore } from "../../store/authStore";

export default function Home() {
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);

  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: "space-between", paddingVertical: theme.spacing.xl }}>
        <View style={{ gap: theme.spacing.xs }}>
          <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>
            Welcome back
          </Text>
          <Text style={[theme.typography.display, { color: theme.color.textPrimary }]}>
            {profile?.first_name ?? "there"} 👋
          </Text>
        </View>

        <View style={{ alignItems: "center", gap: theme.spacing.md }}>
          <Text
            style={[
              theme.typography.body,
              { color: theme.color.textSecondary, textAlign: "center" },
            ]}
          >
            Ready for a real conversation? Get matched instantly for a timed chat date.
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Button label="Start Speed Dating" onPress={() => router.push("/(app)/queue")} />
        </View>
      </View>
    </ScreenContainer>
  );
}
