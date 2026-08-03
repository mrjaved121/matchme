import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Tag } from "../../../components/Tag";
import { LoadingState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";
import { publicPhotoUrl } from "../../../lib/photoUrl";
import { calculateAge } from "../../../lib/discover";

type PreviewProfile = {
  first_name: string | null;
  age: number | null;
  is_verified: boolean;
  job_title: string | null;
  education: string | null;
  bio: string;
  interest_tags: string[];
};

export default function ProfilePreview() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);

  const { data: photos, isLoading: photosLoading } = useQuery({
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

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-preview-profile", myId],
    queryFn: async (): Promise<PreviewProfile> => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, birthdate, is_verified, job_title, education, bio, interest_tags")
        .eq("id", myId)
        .single();
      return {
        first_name: data?.first_name ?? null,
        age: data?.birthdate ? calculateAge(data.birthdate) : null,
        is_verified: data?.is_verified ?? false,
        job_title: data?.job_title ?? null,
        education: data?.education ?? null,
        bio: data?.bio ?? "",
        interest_tags: data?.interest_tags ?? [],
      };
    },
  });

  if (photosLoading || profileLoading || !profile) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xl }} showsVerticalScrollIndicator={false}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            paddingTop: theme.spacing.sm,
          }}
        >
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: theme.color.textPrimary, fontSize: 22 }}>‹</Text>
          </Pressable>
          <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>Preview</Text>
        </View>

        {photos && photos.length > 0 ? (
          <Image
            source={{ uri: publicPhotoUrl(photos[0].storage_path) }}
            style={{ width: "100%", aspectRatio: 4 / 5, marginTop: theme.spacing.sm }}
          />
        ) : null}

        <View style={{ paddingHorizontal: theme.spacing.md, marginTop: theme.spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>
              {profile.first_name}
              {profile.age ? `  ${profile.age}` : ""}
            </Text>
            {profile.is_verified ? <Text style={{ fontSize: 16 }}>🛡️</Text> : null}
          </View>
          {profile.job_title || profile.education ? (
            <Text style={[theme.typography.subtext, { color: theme.color.textSecondary, marginTop: 2 }]}>
              {[profile.job_title, profile.education].filter(Boolean).join(" · ")}
            </Text>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              gap: 10,
              backgroundColor: theme.color.error + "18",
              borderRadius: theme.radius.card,
              padding: theme.spacing.sm,
              marginTop: theme.spacing.md,
              alignItems: "flex-start",
            }}
          >
            <Text style={{ fontSize: 16 }}>ℹ️</Text>
            <Text style={[theme.typography.caption, { color: theme.color.textSecondary, flex: 1 }]}>
              This is how your profile appears to others. Tap{" "}
              <Text
                style={{ color: theme.color.primary, fontWeight: "700" }}
                onPress={() => router.push("/(app)/profile/edit")}
              >
                Edit Profile
              </Text>{" "}
              to make changes.
            </Text>
          </View>

          {profile.bio ? (
            <View style={{ marginTop: theme.spacing.lg }}>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.color.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
                ]}
              >
                About
              </Text>
              <Text style={[theme.typography.body, { color: theme.color.textPrimary, marginTop: 6 }]}>
                {profile.bio}
              </Text>
            </View>
          ) : null}

          {profile.interest_tags.length > 0 ? (
            <View style={{ marginTop: theme.spacing.lg }}>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.color.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
                ]}
              >
                Interests
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {profile.interest_tags.map((tag, index) => (
                  <Tag key={tag} label={tag.charAt(0).toUpperCase() + tag.slice(1)} index={index} />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
