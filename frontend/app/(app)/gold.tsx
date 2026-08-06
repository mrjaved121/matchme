import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

// Photo by Priscilla Du Preez on Unsplash — Unsplash License, free for
// commercial use. Not the Stitch export's own preview image, which carries
// no cleared usage rights.
const BANNER_PHOTO =
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?fm=jpg&q=80&w=1200&auto=format&fit=crop";

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; label: string; sublabel: string }[] = [
  { icon: "heart", label: "Unlimited Likes", sublabel: "Never run out of sparks." },
  { icon: "rocket", label: "5 Weekly Boosts", sublabel: "Be the top profile in your area." },
  { icon: "eye", label: "See Who Likes You", sublabel: "No more guessing, just matching." },
  { icon: "airplane", label: "Passport", sublabel: "Match with people anywhere in the world." },
  { icon: "arrow-undo", label: "Unlimited Rewinds", sublabel: "Undo an accidental swipe." },
  { icon: "eye-off", label: "Incognito Mode", sublabel: "Only appear to people you like." },
];

type PlanId = "monthly" | "biannual" | "annual";

const PLAN_DURATION_MS: Record<PlanId, number> = {
  monthly: 30 * 24 * 60 * 60 * 1000,
  biannual: 6 * 30 * 24 * 60 * 60 * 1000,
  annual: 365 * 24 * 60 * 60 * 1000,
};

// Matches design/stitch_just_spark_ui_kit/spark_plus_upgrade/code.html: a
// soft ambient-glow header with a fire-badge icon, a photo banner, a
// feature-card list, and a horizontal-scroll plan selector with
// "Most Popular"/"Best Value" badges, capped by a sticky gradient CTA. The
// export models 3 plans and 4 features; this app's real feature set and
// pricing (from app_config) are richer, so both lists are longer here
// rather than trimmed to match a mockup exactly.
export default function GoldPaywall() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("biannual");
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

  const monthlyPrice = config?.gold_monthly_price_usd ?? 19.99;
  const annualMonthlyPrice = config?.gold_annual_price_usd ?? 9.99;
  const biannualMonthlyPrice = (monthlyPrice + annualMonthlyPrice) / 2;

  const PLANS: { id: PlanId; label: string; price: number; badge?: string }[] = [
    { id: "monthly", label: "1 Month", price: monthlyPrice },
    { id: "biannual", label: "6 Months", price: biannualMonthlyPrice, badge: "Most Popular" },
    { id: "annual", label: "12 Months", price: annualMonthlyPrice, badge: "Best Value" },
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
    router.replace("/(app)/gold-success");
  }

  return (
    <ScreenContainer padded={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl + 140 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "center", paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.color.surfaceVariant,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: theme.spacing.md,
              ...theme.shadow.floating,
            }}
          >
            <Ionicons name="flame" size={40} color={theme.color.primary} />
          </View>
          <Text style={[theme.typography.display, { color: theme.color.textPrimary, textAlign: "center" }]}>
            Ignite Your Connection
          </Text>
          <Text style={[theme.typography.bodyLg, { color: theme.color.textSecondary, textAlign: "center", marginTop: 6, maxWidth: 280 }]}>
            Unlock the full power of Spark with premium features.
          </Text>
        </View>

        <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg }}>
          <View style={{ width: "100%", height: 192, borderRadius: 24, overflow: "hidden" }}>
            <Image source={{ uri: BANNER_PHOTO }} style={{ width: "100%", height: "100%" }} cachePolicy="memory-disk" />
            <LinearGradient colors={["transparent", "rgba(20,16,25,0.5)"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%" }} />
            <View style={{ position: "absolute", bottom: 12, left: 12, right: 12, flexDirection: "row", justifyContent: "flex-end" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.color.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radius.pill }}>
                <Ionicons name="heart" size={13} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>Match</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
          {BENEFITS.map((b) => (
            <View
              key={b.label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.md,
                backgroundColor: theme.color.surface,
                borderRadius: 20,
                padding: theme.spacing.md,
                ...theme.shadow.card,
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.color.surfaceSecondary, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={b.icon} size={19} color={theme.color.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[theme.typography.body, { color: theme.color.textPrimary, fontWeight: "700" }]}>{b.label}</Text>
                <Text style={[theme.typography.caption, { color: theme.color.textSecondary, marginTop: 2 }]}>{b.sublabel}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: theme.spacing.xl }}>
          <Text style={[theme.typography.title, { color: theme.color.textPrimary, textAlign: "center", marginBottom: theme.spacing.md }]}>
            Select Plan
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg }}>
            {PLANS.map((plan) => {
              const selected = plan.id === selectedPlan;
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => setSelectedPlan(plan.id)}
                  style={{
                    width: 140,
                    alignItems: "center",
                    paddingVertical: theme.spacing.md,
                    borderRadius: 20,
                    backgroundColor: theme.color.surface,
                    borderWidth: 2,
                    borderColor: selected ? theme.color.primary : "transparent",
                    ...theme.shadow.card,
                  }}
                >
                  {plan.badge ? (
                    <View
                      style={{
                        position: "absolute",
                        top: -10,
                        backgroundColor: theme.color.primary,
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderRadius: theme.radius.pill,
                      }}
                    >
                      <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 }}>{plan.badge}</Text>
                    </View>
                  ) : null}
                  <Text style={[theme.typography.body, { color: theme.color.textPrimary, fontWeight: "700", marginTop: plan.badge ? 8 : 0 }]}>{plan.label}</Text>
                  <Text style={[theme.typography.title, { color: selected ? theme.color.primary : theme.color.textPrimary, marginTop: 4 }]}>
                    ${plan.price.toFixed(2)}
                  </Text>
                  <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>/mo</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
          paddingTop: theme.spacing.xl,
        }}
      >
        <LinearGradient
          colors={["transparent", theme.color.background]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: theme.spacing.xl }}
        />
        <Button label={loading ? "Upgrading…" : "Upgrade to Spark Plus"} onPress={subscribe} loading={loading} fullWidth />
        <Pressable onPress={() => router.back()} style={{ alignItems: "center", marginTop: theme.spacing.sm }}>
          <Text style={[theme.typography.body, { color: theme.color.textSecondary, fontWeight: "700" }]}>Maybe Later</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
