import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { Tag } from "../../../components/Tag";
import { LoadingState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";
import { publicPhotoUrl } from "../../../lib/photoUrl";

type ProfileExtra = {
  bio: string;
  job_title: string | null;
  education: string | null;
  interest_tags: string[];
};

function computeStrength(photoCount: number, extra: ProfileExtra | undefined): number {
  if (!extra) return 0;
  let score = 0;
  score += Math.min(photoCount, 3) * (40 / 3);
  score += extra.bio.trim().length >= 10 ? 20 : 0;
  score += extra.interest_tags.length >= 3 ? 20 : 0;
  score += extra.job_title && extra.education ? 20 : extra.job_title || extra.education ? 10 : 0;
  return Math.round(score);
}

export default function MyProfile() {
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const myId = useAuthStore((s) => s.session!.user.id);

  const { data: photos, isLoading } = useQuery({
    queryKey: ["my-photos", myId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profile_photos")
        .select("storage_path, position")
        .eq("profile_id", myId)
        .order("position", { ascending: true });
      return data ?? [];
    },
  });

  const { data: extra } = useQuery({
    queryKey: ["my-profile-extra", myId],
    queryFn: async (): Promise<ProfileExtra> => {
      const { data } = await supabase
        .from("profiles")
        .select("bio, job_title, education, interest_tags")
        .eq("id", myId)
        .single();
      return {
        bio: data?.bio ?? "",
        job_title: data?.job_title ?? null,
        education: data?.education ?? null,
        interest_tags: data?.interest_tags ?? [],
      };
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["my-stats", myId],
    queryFn: async () => {
      const [{ count: likes }, { count: matches }, { data: viewerRows }] = await Promise.all([
        supabase
          .from("swipes")
          .select("*", { count: "exact", head: true })
          .eq("swiped_id", myId)
          .in("action", ["like", "superlike"]),
        supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("status", "active")
          .or(`user_a_id.eq.${myId},user_b_id.eq.${myId}`),
        supabase.from("swipes").select("swiper_id").eq("swiped_id", myId),
      ]);
      const visitors = new Set((viewerRows ?? []).map((r) => r.swiper_id)).size;
      return { likes: likes ?? 0, matches: matches ?? 0, visitors };
    },
  });

  const photoCount = photos?.length ?? 0;
  const strength = computeStrength(photoCount, extra);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xl }} showsVerticalScrollIndicator={false}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: theme.spacing.md,
          }}
        >
          <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>Profile</Text>
          <Button label="Settings" variant="ghost" onPress={() => router.push("/(app)/settings")} />
        </View>

        {isLoading ? (
          <LoadingState />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            {(photos ?? []).map((photo) => (
              <Image
                key={photo.storage_path}
                source={{ uri: publicPhotoUrl(photo.storage_path) }}
                style={{ width: "31%", aspectRatio: 3 / 4, borderRadius: theme.radius.card }}
              />
            ))}
          </View>
        )}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: theme.spacing.md }}>
          <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>
            {profile?.first_name}
          </Text>
          {profile?.is_verified ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: theme.color.success + "22",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: theme.radius.pill,
              }}
            >
              <Text style={{ color: theme.color.success, fontWeight: "700", fontSize: 12 }}>✓ Verified</Text>
            </View>
          ) : null}
          {profile?.is_gold ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: theme.color.gold + "22",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: theme.radius.pill,
              }}
            >
              <Text style={{ color: theme.color.gold, fontWeight: "700", fontSize: 12 }}>★ Gold</Text>
            </View>
          ) : null}
        </View>

        {extra && extra.interest_tags.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: theme.spacing.sm }}>
            {extra.interest_tags.map((tag: string, index: number) => (
              <Tag key={tag} label={tag.charAt(0).toUpperCase() + tag.slice(1)} index={index} />
            ))}
          </View>
        ) : null}

        <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
          <Button
            label="Manage photos"
            variant="secondary"
            onPress={() => router.push("/(app)/profile/photos")}
            style={{ flex: 1 }}
          />
          <Button
            label="Edit profile"
            variant="secondary"
            onPress={() => router.push("/(app)/profile/edit")}
            style={{ flex: 1 }}
          />
        </View>

        {!profile?.is_gold ? (
          <Pressable
            onPress={() => router.push("/(app)/gold")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: theme.color.surface,
              borderRadius: theme.radius.card,
              borderWidth: 1,
              borderColor: theme.color.gold,
              padding: theme.spacing.md,
              marginTop: theme.spacing.lg,
            }}
          >
            <View>
              <Text style={{ color: theme.color.gold, fontWeight: "800", fontSize: 16 }}>👑 Upgrade to Gold</Text>
              <Text style={[theme.typography.caption, { color: theme.color.textSecondary, marginTop: 2 }]}>
                See who likes you · Unlimited likes
              </Text>
            </View>
            <Text style={{ color: theme.color.gold, fontWeight: "700" }}>Try Free</Text>
          </Pressable>
        ) : null}

        <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
          <StatTile label="Likes" value={stats?.likes ?? 0} icon="♥" color={theme.swipe.like} />
          <StatTile label="Matches" value={stats?.matches ?? 0} icon="✦" color={theme.color.primary} />
          <StatTile label="Visitors" value={stats?.visitors ?? 0} icon="◐" color={theme.color.textSecondary} />
        </View>

        <View
          style={{
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.card,
            padding: theme.spacing.md,
            marginTop: theme.spacing.md,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={[theme.typography.subtext, { color: theme.color.textPrimary, fontWeight: "700" }]}>
              Profile Strength
            </Text>
            <Text style={{ color: theme.color.primary, fontWeight: "700" }}>{strength}%</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.color.border, marginTop: 8, overflow: "hidden" }}>
            <View style={{ width: `${strength}%`, height: "100%", backgroundColor: theme.color.primary }} />
          </View>
          {strength < 100 ? (
            <Text style={[theme.typography.caption, { color: theme.color.textSecondary, marginTop: 6 }]}>
              {photoCount < 3
                ? `Add ${3 - photoCount} more photo${3 - photoCount === 1 ? "" : "s"} to strengthen your profile.`
                : "Fill in your bio, interests, and vitals to reach 100%."}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => router.push("/(app)/discovery-preferences")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.card,
            padding: theme.spacing.md,
            marginTop: theme.spacing.md,
          }}
        >
          <Text style={[theme.typography.body, { color: theme.color.textPrimary }]}>🔍 Discovery Preferences</Text>
          <Text style={{ color: theme.color.textSecondary, fontSize: 18 }}>›</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function StatTile({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        gap: 2,
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.card,
        paddingVertical: theme.spacing.md,
      }}
    >
      <Text style={{ color, fontSize: 18 }}>{icon}</Text>
      <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>{value}</Text>
      <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>{label}</Text>
    </View>
  );
}
