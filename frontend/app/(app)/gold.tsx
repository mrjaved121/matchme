import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

const BENEFITS = [
  { icon: "👀", label: "See who likes you" },
  { icon: "♥", label: "Unlimited likes" },
  { icon: "↺", label: "Unlimited rewinds" },
  { icon: "⚡", label: "5 free boosts a month" },
  { icon: "🌐", label: "Global Mode included" },
];

export default function GoldPaywall() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    setLoading(true);
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);
    const { error } = await supabase
      .from("profiles")
      .update({ is_gold: true, gold_expires_at: expires.toISOString() })
      .eq("id", myId);
    setLoading(false);

    if (error) {
      Alert.alert("Couldn't upgrade", error.message);
      return;
    }

    await refreshProfile();
    Alert.alert(
      "Welcome to Gold",
      "This is a demo upgrade — no real payment was charged. Real billing isn't wired up yet.",
      [{ text: "OK", onPress: () => router.back() }],
    );
  }

  return (
    <ScreenContainer padded={false} backgroundColor="#0C0C10">
      <View style={{ flex: 1, padding: theme.spacing.lg, justifyContent: "center" }}>
        <Text style={{ fontSize: 48, textAlign: "center" }}>👑</Text>
        <Text style={[theme.typography.display, { color: theme.color.gold, textAlign: "center", marginTop: theme.spacing.sm }]}>
          MatchMe Gold
        </Text>
        <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center", marginTop: 4 }]}>
          Get more matches, faster.
        </Text>

        <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.xl }}>
          {BENEFITS.map((b) => (
            <View key={b.label} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={{ fontSize: 20 }}>{b.icon}</Text>
              <Text style={[theme.typography.body, { color: theme.color.textPrimary }]}>{b.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.sm }}>
          <Button
            label={loading ? "Upgrading…" : "Try Gold — Demo Upgrade"}
            onPress={subscribe}
            loading={loading}
            gradientColors={theme.color.goldGradient}
            textColor="#1A1200"
          />
          <Text style={[theme.typography.caption, { color: theme.color.textSecondary, textAlign: "center" }]}>
            No payment required yet — this grants Gold instantly for testing.
          </Text>
          <Button label="Not now" variant="ghost" textColor={theme.color.textSecondary} onPress={() => router.back()} />
        </View>
      </View>
    </ScreenContainer>
  );
}
