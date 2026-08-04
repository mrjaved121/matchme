import { Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "../components/ScreenContainer";
import { Button } from "../components/Button";
import { useTheme } from "../theme/useTheme";

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
            backgroundColor: theme.color.success + "22",
          }}
        >
          <Text style={{ fontSize: 44, color: theme.color.success }}>✓</Text>
        </View>
        <Text style={[theme.typography.display, { color: theme.color.textPrimary, textAlign: "center" }]}>
          You're all set!
        </Text>
        <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center" }]}>
          Your Spark account is ready. Just a couple of quick permissions and you're in.
        </Text>
      </View>

      <View style={{ paddingBottom: theme.spacing.xl }}>
        <Button label="Continue" onPress={() => router.replace("/permissions-location")} />
      </View>
    </ScreenContainer>
  );
}
