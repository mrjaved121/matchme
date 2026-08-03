import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

const BENEFITS: { icon: string; label: string; sublabel: string; tint: string }[] = [
  { icon: "♥", label: "Unlimited Likes", sublabel: "Like as many as you want", tint: "#FF4D6D" },
  { icon: "👀", label: "See Who Likes You", sublabel: "Match instantly with admirer", tint: "#A855F7" },
  { icon: "↩", label: "Rewind", sublabel: "Undo an accidental swipe", tint: "#3B82F6" },
  { icon: "⭐", label: "5 Super Likes/day", sublabel: "Stand out from the crowd", tint: "#F0B429" },
  { icon: "🚀", label: "1 Boost/month", sublabel: "Top profile for 30 minutes", tint: "#A855F7" },
  { icon: "🌍", label: "Passport", sublabel: "Match in any city worldwide", tint: "#2E9C7B" },
  { icon: "🕵️", label: "Incognito Mode", sublabel: "Only appear to people you like", tint: "#8C7178" },
];

type PlanId = "weekly" | "monthly" | "annual";

const PLAN_DURATION_MS: Record<PlanId, number> = {
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  annual: 365 * 24 * 60 * 60 * 1000,
};

export default function GoldPaywall() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("monthly");
  const [loading, setLoading] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["app-config"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_config")
        .select("gold_weekly_price_usd, gold_monthly_price_usd, gold_annual_price_usd")
        .single();
      return data;
    },
  });

  const PLANS: { id: PlanId; label: string; price: string; badge?: string }[] = [
    { id: "weekly", label: "Weekly", price: `$${(config?.gold_weekly_price_usd ?? 9.99).toFixed(2)}/wk` },
    {
      id: "monthly",
      label: "Monthly",
      price: `$${(config?.gold_monthly_price_usd ?? 19.99).toFixed(2)}/mo`,
      badge: "MOST POPULAR",
    },
    {
      id: "annual",
      label: "Annual",
      price: `$${(config?.gold_annual_price_usd ?? 9.99).toFixed(2)}/mo`,
      badge: "BEST VALUE",
    },
  ];

  async function subscribe() {
    setLoading(true);
    const expires = new Date(Date.now() + PLAN_DURATION_MS[selectedPlan]);
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
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xl }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl }}>
          <Text style={[theme.typography.display, { color: theme.color.gold, textAlign: "center" }]}>
            MatchMe Gold
          </Text>
          <Text
            style={[
              theme.typography.body,
              { color: theme.color.textSecondary, textAlign: "center", marginTop: 4 },
            ]}
          >
            See who likes you, rewind, unlimited likes.
          </Text>
        </View>

        <View
          style={{
            gap: 0,
            marginTop: theme.spacing.lg,
            marginHorizontal: theme.spacing.lg,
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.card,
            overflow: "hidden",
          }}
        >
          {BENEFITS.map((b, index) => (
            <View
              key={b.label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: theme.spacing.sm,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: theme.color.border,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: b.tint + "26",
                }}
              >
                <Text style={{ fontSize: 16 }}>{b.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[theme.typography.body, { color: theme.color.textPrimary, fontWeight: "700" }]}>
                  {b.label}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>
                  {b.sublabel}
                </Text>
              </View>
              <Text style={{ color: theme.color.gold, fontSize: 16, fontWeight: "700" }}>✓</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.lg, marginHorizontal: theme.spacing.lg }}>
          {PLANS.map((plan) => {
            const selected = plan.id === selectedPlan;
            return (
              <View key={plan.id} style={{ position: "relative" }}>
                {plan.badge ? (
                  <View
                    style={{
                      position: "absolute",
                      top: -10,
                      right: 16,
                      zIndex: 1,
                      backgroundColor: theme.color.gold,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: theme.radius.pill,
                    }}
                  >
                    <Text style={{ color: "#1A1200", fontSize: 11, fontWeight: "800" }}>{plan.badge}</Text>
                  </View>
                ) : null}
                <Pressable
                  onPress={() => setSelectedPlan(plan.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: theme.spacing.md,
                    borderRadius: theme.radius.card,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? theme.color.gold : theme.color.border,
                    backgroundColor: theme.color.surface,
                  }}
                >
                  <Text style={[theme.typography.body, { color: theme.color.textPrimary, fontWeight: "700" }]}>
                    {plan.label}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text style={{ color: theme.color.textSecondary, fontWeight: "600" }}>{plan.price}</Text>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: selected ? 0 : 1,
                        borderColor: theme.color.textSecondary,
                        backgroundColor: selected ? theme.color.gold : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selected ? <Text style={{ color: "#1A1200", fontSize: 12, fontWeight: "800" }}>✓</Text> : null}
                    </View>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={{ marginTop: theme.spacing.lg, marginHorizontal: theme.spacing.lg, gap: theme.spacing.sm }}>
          <Button
            label={loading ? "Upgrading…" : "👑 Get MatchMe Gold"}
            onPress={subscribe}
            loading={loading}
            gradientColors={theme.color.goldGradient}
            textColor="#1A1200"
          />
          <Text style={[theme.typography.caption, { color: theme.color.textSecondary, textAlign: "center" }]}>
            Cancel anytime · demo upgrade, no payment required yet.
          </Text>
          <Button label="Not now" variant="ghost" textColor={theme.color.textSecondary} onPress={() => router.back()} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
