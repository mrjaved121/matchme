import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";

export default function ManageSubscription() {
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const myId = useAuthStore((s) => s.session!.user.id);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [loading, setLoading] = useState(false);

  async function cancel() {
    Alert.alert("Cancel Gold?", "You'll lose access to Gold features immediately.", [
      { text: "Keep Gold", style: "cancel" },
      {
        text: "Cancel subscription",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          await supabase.from("profiles").update({ is_gold: false, gold_expires_at: null }).eq("id", myId);
          await refreshProfile();
          setLoading(false);
        },
      },
    ]);
  }

  return (
    <ScreenContainer>
      <Text style={[theme.typography.title, { color: theme.color.textPrimary, marginTop: theme.spacing.md, marginBottom: theme.spacing.md }]}>
        💳 Manage Subscription
      </Text>

      <View style={{ backgroundColor: theme.color.surface, borderRadius: theme.radius.card, padding: theme.spacing.md, gap: 8 }}>
        <Text style={[theme.typography.body, { color: theme.color.textPrimary, fontWeight: "700" }]}>
          {profile?.is_gold ? "👑 MatchMe Gold — Active" : "No active subscription"}
        </Text>
        <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>
          {profile?.is_gold
            ? "You have access to who-likes-you, unlimited likes, and monthly boosts."
            : "Upgrade to Gold to see who likes you and get unlimited likes."}
        </Text>
      </View>

      {profile?.is_gold ? (
        <Button label="Cancel subscription" variant="danger" onPress={cancel} loading={loading} style={{ marginTop: theme.spacing.lg }} />
      ) : (
        <Button
          label="Upgrade to Gold"
          onPress={() => router.push("/(app)/gold")}
          gradientColors={theme.color.goldGradient}
          textColor="#1A1200"
          style={{ marginTop: theme.spacing.lg }}
        />
      )}
    </ScreenContainer>
  );
}
