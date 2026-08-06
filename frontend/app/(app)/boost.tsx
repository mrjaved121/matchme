import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { publicPhotoUrl } from "../../lib/photoUrl";

const DURATIONS: { minutes: number; badge?: string }[] = [
  { minutes: 15 },
  { minutes: 30, badge: "Popular" },
  { minutes: 60, badge: "Save 20%" },
];

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: "eye-outline", title: "Increased Visibility", body: "Your profile moves to the top of the deck for everyone in your area." },
  { icon: "heart-outline", title: "More Matches", body: "Users who boost get 3x more matches on average." },
  { icon: "stats-chart-outline", title: "Stand Out", body: "Stay at the top of the deck for the full duration you pick." },
];

// Matches design/stitch_just_spark_ui_kit/activate_boost/code.html: a
// gradient hero with your avatar + glow rings + a bolt badge, 3 benefit
// cards, a duration selector, and an Activate button. The export's duration
// picker (15/30/60 min) is used instead of this screen's old fake "1/5/10
// boost credit" tiers, which looked purchasable but all activated the exact
// same flat 30-minute boost regardless of which tier was picked — the
// export's minutes-based options map onto what the backend actually does
// (parameterize the boost's expiry by minutes), so picking one now really
// changes the outcome. There's no credits ledger backing this app, so the
// export's "Get More Credits" button is dropped rather than pointing at a
// system that doesn't exist.
export default function Boost() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const [selected, setSelected] = useState(1);
  const [loading, setLoading] = useState(false);

  const { data: photo } = useQuery({
    queryKey: ["my-primary-photo", myId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profile_photos")
        .select("storage_path")
        .eq("profile_id", myId)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data?.storage_path ? publicPhotoUrl(data.storage_path) : null;
    },
  });

  async function activate() {
    setLoading(true);
    const minutes = DURATIONS[selected].minutes;
    const until = new Date(Date.now() + minutes * 60 * 1000);
    const { error } = await supabase.from("profiles").update({ boost_active_until: until.toISOString() }).eq("id", myId);
    setLoading(false);

    if (error) {
      Alert.alert("Couldn't activate boost", error.message);
      return;
    }

    router.replace({ pathname: "/(app)/boost-active", params: { until: until.toISOString(), minutes: String(minutes) } });
  }

  return (
    <ScreenContainer padded={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xl }} showsVerticalScrollIndicator={false}>
        <View
          style={{
            alignItems: "center",
            paddingTop: theme.spacing.xl,
            paddingBottom: theme.spacing.xl,
            paddingHorizontal: theme.spacing.lg,
            backgroundColor: theme.color.surfaceSecondary,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          <View style={{ width: 160, height: 160, alignItems: "center", justifyContent: "center", marginBottom: theme.spacing.lg }}>
            <View style={{ position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: theme.color.primary + "22" }} />
            <View
              style={{
                width: 128,
                height: 128,
                borderRadius: 64,
                overflow: "hidden",
                borderWidth: 4,
                borderColor: theme.color.surface,
                ...theme.shadow.floating,
              }}
            >
              {photo ? (
                <Image source={{ uri: photo }} style={{ width: "100%", height: "100%" }} />
              ) : (
                <View style={{ flex: 1, backgroundColor: theme.color.surface }} />
              )}
            </View>
            <View
              style={{
                position: "absolute",
                bottom: 4,
                right: 8,
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: theme.color.primary,
                alignItems: "center",
                justifyContent: "center",
                ...theme.shadow.floating,
              }}
            >
              <Ionicons name="flash" size={22} color="#FFFFFF" />
            </View>
          </View>
          <Text style={[theme.typography.display, { color: theme.color.textPrimary, textAlign: "center" }]}>
            Be the Center of Attention
          </Text>
          <Text style={[theme.typography.bodyLg, { color: theme.color.textSecondary, textAlign: "center", marginTop: 6, maxWidth: 320 }]}>
            Get up to <Text style={{ color: theme.color.primary, fontWeight: "700" }}>10x more profile views</Text> with a Boost.
          </Text>
        </View>

        <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.xl, gap: theme.spacing.md }}>
          {BENEFITS.map((b) => (
            <View
              key={b.title}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: theme.spacing.md,
                backgroundColor: theme.color.surface,
                borderRadius: 24,
                padding: theme.spacing.md,
                ...theme.shadow.card,
              }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.color.surfaceSecondary, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={b.icon} size={22} color={theme.color.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[theme.typography.body, { color: theme.color.textPrimary, fontWeight: "700" }]}>{b.title}</Text>
                <Text style={[theme.typography.subtext, { color: theme.color.textSecondary, marginTop: 2 }]}>{b.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.xl }}>
          <Text style={[theme.typography.label, { color: theme.color.textSecondary, marginBottom: theme.spacing.sm }]}>SELECT DURATION</Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            {DURATIONS.map((d, index) => {
              const isSelected = index === selected;
              return (
                <Pressable
                  key={d.minutes}
                  onPress={() => setSelected(index)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: theme.spacing.md,
                    borderRadius: 24,
                    backgroundColor: isSelected ? theme.color.primary + "0D" : theme.color.surfaceSecondary,
                    borderWidth: 2,
                    borderColor: isSelected ? theme.color.primary : "transparent",
                  }}
                >
                  <Text style={[theme.typography.title, { color: isSelected ? theme.color.primary : theme.color.textPrimary }]}>{d.minutes}</Text>
                  <Text style={[theme.typography.caption, { color: isSelected ? theme.color.primary : theme.color.textSecondary }]}>Mins</Text>
                  {d.badge ? (
                    <View style={{ marginTop: 8, backgroundColor: isSelected ? theme.color.primary : theme.color.surfaceVariant, paddingHorizontal: 10, paddingVertical: 3, borderRadius: theme.radius.pill }}>
                      <Text style={{ color: isSelected ? "#FFFFFF" : theme.color.textSecondary, fontSize: 10, fontWeight: "700" }}>{d.badge}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.xl, gap: theme.spacing.sm }}>
          <Button label={loading ? "Activating…" : "Activate Boost"} onPress={activate} loading={loading} fullWidth />
          <Button label="Maybe Later" variant="ghost" textColor={theme.color.textSecondary} onPress={() => router.back()} fullWidth />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
