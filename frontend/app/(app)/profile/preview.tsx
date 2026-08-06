import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { LoadingState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";
import { publicPhotoUrl } from "../../../lib/photoUrl";
import { calculateAge } from "../../../lib/discover";
import { interestIcon } from "../../../lib/interestIcon";

type PreviewProfile = {
  first_name: string | null;
  birthdate: string | null;
  city: string | null;
  is_verified: boolean;
  job_title: string | null;
  education: string | null;
  bio: string;
  interest_tags: string[];
};

// Matches design/stitch_just_spark_ui_kit/profile_preview/code.html's content
// structure: full-bleed photo hero with name/verified/location overlaid on a
// gradient, then a rounded-top sheet with About Me and Interests. The
// export's bottom swipe buttons (pass/like/superlike) don't apply here —
// this is a self-preview, not a card you can swipe on — and its "More About
// Me" prompt-answer cards have no backing data field in this app, so both
// are left out rather than faked. The "this is how others see you" banner
// and Edit Profile link are a pre-existing, disclosed addition with no
// export equivalent, since a self-preview needs a way back to editing.
export default function ProfilePreview() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const [photoIndex, setPhotoIndex] = useState(0);

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
        .select("first_name, birthdate, city, is_verified, job_title, education, bio, interest_tags")
        .eq("id", myId)
        .single();
      return {
        first_name: data?.first_name ?? null,
        birthdate: data?.birthdate ?? null,
        city: data?.city ?? null,
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

  const age = profile.birthdate ? calculateAge(profile.birthdate) : null;
  const currentPhoto = photos?.[photoIndex];

  return (
    <ScreenContainer padded={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ width: "100%", aspectRatio: 1 }}>
          {currentPhoto ? (
            <Pressable
              onPress={() => {
                if (!photos || photos.length < 2) return;
                setPhotoIndex((i) => (i + 1) % photos.length);
              }}
              style={{ width: "100%", height: "100%" }}
            >
              <Image source={{ uri: publicPhotoUrl(currentPhoto.storage_path) }} style={{ width: "100%", height: "100%" }} cachePolicy="memory-disk" />
            </Pressable>
          ) : (
            <View style={{ width: "100%", height: "100%", backgroundColor: theme.color.surfaceSecondary }} />
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)"]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%" }}
          />

          {photos && photos.length > 1 ? (
            <View style={{ position: "absolute", top: theme.spacing.sm, left: theme.spacing.sm, right: theme.spacing.sm, flexDirection: "row", gap: 4 }}>
              {photos.map((_, i) => (
                <View
                  key={i}
                  style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i === photoIndex ? "#FFFFFF" : "rgba(255,255,255,0.35)" }}
                />
              ))}
            </View>
          ) : null}

          <Pressable
            onPress={() => router.back()}
            style={{
              position: "absolute",
              top: theme.spacing.sm,
              left: theme.spacing.sm,
              marginTop: photos && photos.length > 1 ? 14 : 0,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0,0,0,0.5)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={{ position: "absolute", bottom: theme.spacing.lg, left: theme.spacing.md, right: theme.spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={[theme.typography.display, { color: "#FFFFFF" }]}>
                {profile.first_name}
                {age ? `, ${age}` : ""}
              </Text>
              {profile.is_verified ? <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" /> : null}
            </View>
            {profile.city ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={{ color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>{profile.city}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View
          style={{
            backgroundColor: theme.color.surface,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            marginTop: -24,
            paddingHorizontal: theme.spacing.md,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.xl,
            gap: theme.spacing.lg,
          }}
        >
          <View style={{ width: 48, height: 6, borderRadius: 3, backgroundColor: theme.color.border, alignSelf: "center" }} />

          <View
            style={{
              flexDirection: "row",
              gap: 10,
              backgroundColor: theme.color.surfaceSecondary,
              borderRadius: theme.radius.card,
              padding: theme.spacing.sm,
              alignItems: "flex-start",
            }}
          >
            <Ionicons name="information-circle-outline" size={18} color={theme.color.textSecondary} />
            <Text style={[theme.typography.caption, { color: theme.color.textSecondary, flex: 1 }]}>
              This is how your profile appears to others. Tap{" "}
              <Text style={{ color: theme.color.primary, fontWeight: "700" }} onPress={() => router.push("/(app)/profile/edit")}>
                Edit Profile
              </Text>{" "}
              to make changes.
            </Text>
          </View>

          {profile.job_title || profile.education ? (
            <Text style={[theme.typography.subtext, { color: theme.color.textSecondary, marginTop: -theme.spacing.sm }]}>
              {[profile.job_title, profile.education].filter(Boolean).join(" · ")}
            </Text>
          ) : null}

          <View>
            <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>About me</Text>
            <Text style={[theme.typography.bodyLg, { color: theme.color.textSecondary, marginTop: 8, lineHeight: 26 }]}>
              {profile.bio || "No bio yet."}
            </Text>
          </View>

          {profile.interest_tags.length > 0 ? (
            <View>
              <Text style={[theme.typography.title, { color: theme.color.textPrimary, marginBottom: 12 }]}>Interests</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {profile.interest_tags.map((tag) => (
                  <View
                    key={tag}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: theme.color.surfaceSecondary,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: theme.radius.pill,
                    }}
                  >
                    <Ionicons name={interestIcon(tag)} size={16} color={theme.color.primary} />
                    <Text style={{ color: theme.color.textPrimary, fontWeight: "600", fontSize: 13 }}>
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {profile.is_verified ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                backgroundColor: theme.color.inputFill,
                borderRadius: theme.radius.input,
                padding: theme.spacing.md,
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={22} color={theme.color.textSecondary} />
              <View>
                <Text style={[theme.typography.label, { color: theme.color.textPrimary }]}>Identity Verified</Text>
                <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>
                  You've verified your profile photo.
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
