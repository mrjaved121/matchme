import { Text, View } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenContainer } from "../components/ScreenContainer";
import { Button } from "../components/Button";
import { useTheme } from "../theme/useTheme";

// Matches design/stitch_just_spark_ui_kit/all_set/code.html in spirit: a
// celebratory icon, "You're all set!", and a primary CTA. The export's
// "Start meeting people" button goes straight to Discover, but this app
// still needs to request location/notification permissions first (a real
// requirement the static mockup doesn't model) — same label, same
// excitement, just routed through that necessary step. The export's
// illustration is a Stitch preview asset with no cleared usage rights, so
// it's a themed icon instead.
export default function AccountCreated() {
  const theme = useTheme();

  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: theme.spacing.md }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.color.surfaceSecondary,
          }}
        >
          <Ionicons name="sparkles" size={44} color={theme.color.primary} />
        </View>
        <Text style={[theme.typography.displayLg, { color: theme.color.textPrimary, textAlign: "center" }]}>
          You're all set!
        </Text>
        <Text style={[theme.typography.bodyLg, { color: theme.color.textSecondary, textAlign: "center" }]}>
          Welcome to Spark. We're excited to help you find your next great connection.
        </Text>
      </View>

      <View style={{ paddingBottom: theme.spacing.xl }}>
        <Button label="Start meeting people" onPress={() => router.replace("/permissions-location")} fullWidth />
      </View>
    </ScreenContainer>
  );
}
