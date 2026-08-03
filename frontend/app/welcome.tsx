import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "../components/ScreenContainer";
import { TextField } from "../components/TextField";
import { Button } from "../components/Button";
import { useTheme } from "../theme/useTheme";
import { storePendingReferralCode } from "../lib/referral";

export default function Welcome() {
  const theme = useTheme();
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  const [referralCode, setReferralCode] = useState(ref ?? "");

  useEffect(() => {
    if (ref) storePendingReferralCode(ref).catch(() => {});
  }, [ref]);

  async function go(mode: "signup" | "login") {
    if (referralCode.trim()) {
      await storePendingReferralCode(referralCode).catch(() => {});
    }
    router.push({ pathname: "/sign-in", params: { mode } });
  }

  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: theme.spacing.sm }}>
        <Text style={{ fontSize: 56 }}>◈</Text>
        <Text style={[theme.typography.display, { color: theme.color.textPrimary }]}>MatchMe</Text>
        <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center" }]}>
          Real, timed chats — no endless swiping.
        </Text>
      </View>

      <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xl }}>
        {!ref ? (
          <TextField
            label="Referral code (optional)"
            placeholder="ABC123"
            autoCapitalize="characters"
            value={referralCode}
            onChangeText={setReferralCode}
          />
        ) : null}
        <Button label="Create Account" onPress={() => go("signup")} />
        <Button label="Log In" variant="secondary" onPress={() => go("login")} />
      </View>
    </ScreenContainer>
  );
}
