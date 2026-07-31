import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

const TIERS = [
  { count: 1, price: "$2.99", label: "1 Boost" },
  { count: 5, price: "$9.99", label: "5 Boosts", badge: "BEST VALUE" },
  { count: 10, price: "$17.99", label: "10 Boosts" },
];

export default function Boost() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);

  async function activate() {
    setLoading(true);
    const until = new Date(Date.now() + 30 * 60 * 1000);
    const { error } = await supabase.from("profiles").update({ boost_active_until: until.toISOString() }).eq("id", myId);
    setLoading(false);

    if (error) {
      Alert.alert("Couldn't activate boost", error.message);
      return;
    }

    Alert.alert(
      "Boost activated",
      "You're the top profile for the next 30 minutes. This is a demo — no real payment was charged.",
      [{ text: "OK", onPress: () => router.back() }],
    );
  }

  return (
    <ScreenContainer padded={false} backgroundColor="#0C0C10">
      <View style={{ flex: 1, padding: theme.spacing.lg, justifyContent: "center" }}>
        <Text style={{ fontSize: 48, textAlign: "center" }}>⚡</Text>
        <Text style={[theme.typography.display, { color: theme.swipe.boost, textAlign: "center", marginTop: theme.spacing.sm }]}>
          Boost Your Profile
        </Text>
        <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center", marginTop: 4 }]}>
          Be the top profile for 30 minutes. Get up to 10× more matches.
        </Text>

        <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginTop: theme.spacing.xl }}>
          {TIERS.map((tier, index) => (
            <Pressable
              key={tier.count}
              onPress={() => setSelected(index)}
              style={{
                flex: 1,
                borderRadius: theme.radius.card,
                borderWidth: 2,
                borderColor: selected === index ? theme.swipe.boost : theme.color.border,
                backgroundColor: theme.color.surface,
                padding: theme.spacing.sm,
                alignItems: "center",
                gap: 4,
              }}
            >
              {tier.badge ? (
                <View style={{ backgroundColor: theme.swipe.boost, borderRadius: theme.radius.pill, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 2 }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>{tier.badge}</Text>
                </View>
              ) : null}
              <Text style={[theme.typography.body, { color: theme.color.textPrimary, fontWeight: "700" }]}>{tier.label}</Text>
              <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>{tier.price}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.sm }}>
          <Button
            label={loading ? "Activating…" : "Activate Boost"}
            onPress={activate}
            loading={loading}
            gradientColors={[theme.swipe.boost, "#7C3AED"] as const}
          />
          <Text style={[theme.typography.caption, { color: theme.color.textSecondary, textAlign: "center" }]}>
            No payment required yet — this grants a boost instantly for testing.
          </Text>
          <Button label="Not now" variant="ghost" textColor={theme.color.textSecondary} onPress={() => router.back()} />
        </View>
      </View>
    </ScreenContainer>
  );
}
