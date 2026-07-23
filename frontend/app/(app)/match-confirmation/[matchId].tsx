import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { useTheme } from "../../../theme/useTheme";

export default function MatchConfirmation() {
  const theme = useTheme();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();

  return (
    <ScreenContainer>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.lg }}>
        <Text style={{ fontSize: 56 }}>🎉</Text>
        <Text style={[theme.typography.display, { color: theme.color.textPrimary, textAlign: "center" }]}>
          It's a match!
        </Text>
        <Text
          style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center" }]}
        >
          You both said yes. Say hello and keep the conversation going.
        </Text>
        <View style={{ width: "100%", gap: theme.spacing.sm }}>
          <Button
            label="Send a message"
            onPress={() =>
              router.replace({ pathname: "/(app)/matches/[matchId]", params: { matchId } })
            }
          />
          <Button label="Back to home" variant="ghost" onPress={() => router.replace("/(app)/home")} />
        </View>
      </View>
    </ScreenContainer>
  );
}
