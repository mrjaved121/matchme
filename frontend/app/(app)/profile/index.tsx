import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { decode as decodeBase64 } from "base64-arraybuffer";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { LoadingState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";
import { publicPhotoUrl } from "../../../lib/photoUrl";
import { calculateAge } from "../../../lib/discover";
import { interestIcon } from "../../../lib/interestIcon";
import { fetchUnreadNotificationCount } from "../../../lib/notifications";

const MAX_PHOTOS = 6;
const RING_SIZE = 128;
const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type ProfileExtra = {
  birthdate: string | null;
  bio: string;
  job_title: string | null;
  education: string | null;
  interest_tags: string[];
};

type Photo = { id: string; storage_path: string; position: number };

function computeStrength(photoCount: number, extra: ProfileExtra | undefined): number {
  if (!extra) return 0;
  let score = 0;
  score += Math.min(photoCount, 3) * (40 / 3);
  score += extra.bio.trim().length >= 10 ? 20 : 0;
  score += extra.interest_tags.length >= 3 ? 20 : 0;
  score += extra.job_title && extra.education ? 20 : extra.job_title || extra.education ? 10 : 0;
  return Math.round(score);
}

// Matches design/stitch_just_spark_ui_kit/profile/code.html: a circular
// progress ring around the avatar (ring fill = profile strength), a compact
// name+age headline, a 3-column stat strip (Matches / Likes / Gold), an
// inline "My Photos" grid with add/remove, an "About Me" card, a horizontal
// "My Interests" chip scroller (first chip primary-filled), and a Spark Plus
// upsell card. The export's header is a copy-paste leftover from the
// Messages screen ("Messages" title + bell icon over a Profile-tab nav) —
// replaced here with small Preview/Share/Settings icon buttons, since the
// real app needs an actual way to reach those, which the export doesn't
// show anywhere.
export default function MyProfile() {
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const myId = useAuthStore((s) => s.session!.user.id);
  const queryClient = useQueryClient();
  const [busyPhoto, setBusyPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | undefined>();

  const { data: photos, isLoading: photosLoading } = useQuery({
    queryKey: ["my-photos", myId],
    queryFn: async (): Promise<Photo[]> => {
      const { data } = await supabase
        .from("profile_photos")
        .select("id, storage_path, position")
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
        .select("birthdate, bio, job_title, education, interest_tags")
        .eq("id", myId)
        .single();
      return {
        birthdate: data?.birthdate ?? null,
        bio: data?.bio ?? "",
        job_title: data?.job_title ?? null,
        education: data?.education ?? null,
        interest_tags: data?.interest_tags ?? [],
      };
    },
  });

  const { data: unreadNotifications } = useQuery({
    queryKey: ["notifications-unread", myId],
    queryFn: () => fetchUnreadNotificationCount(myId),
    refetchInterval: 30_000,
  });

  const { data: stats } = useQuery({
    queryKey: ["my-stats", myId],
    queryFn: async () => {
      const [{ count: likes }, { count: matches }] = await Promise.all([
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
      ]);
      return { likes: likes ?? 0, matches: matches ?? 0 };
    },
  });

  async function reloadPhotos() {
    await queryClient.invalidateQueries({ queryKey: ["my-photos", myId] });
    await queryClient.invalidateQueries({ queryKey: ["my-profile-extra", myId] });
  }

  async function pickAndAdd() {
    if (!photos || photos.length >= MAX_PHOTOS) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoError("Photo library access is needed to add photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (result.canceled || !result.assets[0].base64) return;

    setBusyPhoto("new");
    setPhotoError(undefined);
    try {
      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? "image/jpeg";
      const ext = mimeType.split("/")[1] ?? "jpg";
      const nextPosition = photos.length === 0 ? 0 : Math.max(...photos.map((p) => p.position)) + 1;
      const path = `${myId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, decodeBase64(asset.base64!), { contentType: mimeType, upsert: true });
      if (uploadError) throw uploadError;

      const { error: rowError } = await supabase
        .from("profile_photos")
        .insert({ profile_id: myId, storage_path: path, position: nextPosition });
      if (rowError) throw rowError;

      await reloadPhotos();
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "Could not upload photo.");
    } finally {
      setBusyPhoto(null);
    }
  }

  async function removePhoto(photo: Photo) {
    if (!photos || photos.length <= 1) {
      setPhotoError("You need at least one photo on your profile.");
      return;
    }
    setBusyPhoto(photo.id);
    setPhotoError(undefined);

    const { error: deleteError } = await supabase.from("profile_photos").delete().eq("id", photo.id);
    if (deleteError) {
      setPhotoError(deleteError.message);
      setBusyPhoto(null);
      return;
    }
    await supabase.storage.from("profile-photos").remove([photo.storage_path]);
    await reloadPhotos();
    setBusyPhoto(null);
  }

  const photoCount = photos?.length ?? 0;
  const strength = computeStrength(photoCount, extra);
  const age = extra?.birthdate ? calculateAge(extra.birthdate) : null;
  const ringOffset = RING_CIRCUMFERENCE * (1 - strength / 100);
  const primaryPhotoUri = photos && photos.length > 0 ? publicPhotoUrl(photos[0].storage_path) : null;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xl }} showsVerticalScrollIndicator={false}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: theme.spacing.sm,
          }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            <IconPill icon="eye-outline" label="Preview" onPress={() => router.push("/(app)/profile/preview")} />
            <IconPill icon="share-social-outline" label="Share" onPress={() => router.push("/(app)/profile/share")} />
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => router.push("/(app)/notifications")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: theme.color.surfaceSecondary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="notifications-outline" size={18} color={theme.color.textPrimary} />
              {unreadNotifications ? (
                <View
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 9,
                    height: 9,
                    borderRadius: 5,
                    backgroundColor: theme.color.error,
                    borderWidth: 1.5,
                    borderColor: theme.color.surfaceSecondary,
                  }}
                />
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => router.push("/(app)/favorites")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: theme.color.surfaceSecondary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="bookmark-outline" size={18} color={theme.color.textPrimary} />
            </Pressable>
            <Pressable
              onPress={() => router.push("/(app)/settings")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: theme.color.surfaceSecondary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="settings-outline" size={18} color={theme.color.textPrimary} />
            </Pressable>
          </View>
        </View>

        {photosLoading ? (
          <LoadingState />
        ) : (
          <>
            <View style={{ alignItems: "center", marginTop: theme.spacing.md }}>
              <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: "center", justifyContent: "center" }}>
                <View style={{ position: "absolute", width: RING_SIZE, height: RING_SIZE, transform: [{ rotate: "-90deg" }] }}>
                <Svg width={RING_SIZE} height={RING_SIZE}>
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    stroke={theme.color.surfaceVariant}
                    strokeWidth={8}
                    fill="none"
                  />
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    stroke={theme.color.primary}
                    strokeWidth={8}
                    fill="none"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                  />
                </Svg>
                </View>
                <View
                  style={{
                    width: RING_SIZE - 16,
                    height: RING_SIZE - 16,
                    borderRadius: (RING_SIZE - 16) / 2,
                    overflow: "hidden",
                    backgroundColor: theme.color.surfaceSecondary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {primaryPhotoUri ? (
                    <Image source={{ uri: primaryPhotoUri }} style={{ width: "100%", height: "100%" }} />
                  ) : (
                    <Text style={{ fontSize: 36, fontWeight: "700", color: theme.color.primary }}>
                      {profile?.first_name?.[0]?.toUpperCase() ?? "?"}
                    </Text>
                  )}
                </View>
                <View
                  style={{
                    position: "absolute",
                    bottom: -10,
                    backgroundColor: theme.color.surface,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: theme.radius.pill,
                    ...theme.shadow.card,
                  }}
                >
                  <Text style={{ color: theme.color.primary, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>
                    {strength}% COMPLETE
                  </Text>
                </View>
              </View>

              <Text style={[theme.typography.display, { color: theme.color.textPrimary, marginTop: theme.spacing.md }]}>
                {profile?.first_name}
                {age ? `, ${age}` : ""}
              </Text>
              {profile?.is_verified ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.color.verifiedDark} />
                  <Text style={[theme.typography.body, { color: theme.color.textSecondary }]}>Verified Profile</Text>
                </View>
              ) : null}
            </View>

            <View
              style={{
                flexDirection: "row",
                backgroundColor: theme.color.inputFill,
                borderRadius: theme.radius.card,
                padding: theme.spacing.sm,
                marginTop: theme.spacing.lg,
                ...theme.shadow.card,
              }}
            >
              <StatCell value={stats?.matches ?? 0} label="Matches" border />
              <StatCell value={stats?.likes ?? 0} label="Likes" border />
              <Pressable
                onPress={() => !profile?.is_gold && router.push("/(app)/gold")}
                style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 2 }}
              >
                <Ionicons name="ribbon" size={22} color={theme.color.gold} />
                <Text style={{ color: theme.color.gold, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {profile?.is_gold ? "Gold" : "Get Gold"}
                </Text>
              </Pressable>
            </View>

            <View style={{ marginTop: theme.spacing.lg }}>
              <SectionHeader
                title="My Photos"
                action={
                  photoCount < MAX_PHOTOS
                    ? { icon: "add-circle-outline", label: "Add", onPress: pickAndAdd, disabled: busyPhoto === "new" }
                    : undefined
                }
              />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
                {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
                  const photo = photos?.[i];
                  const tileWidth = "31.5%" as const;
                  if (!photo) {
                    return (
                      <Pressable
                        key={`empty-${i}`}
                        onPress={pickAndAdd}
                        style={{
                          width: tileWidth,
                          aspectRatio: 4 / 5,
                          borderRadius: theme.radius.input,
                          borderWidth: 2,
                          borderStyle: "dashed",
                          borderColor: theme.color.border,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: theme.color.surfaceSecondary,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name="camera-outline" size={18} color={theme.color.primary} />
                        </View>
                      </Pressable>
                    );
                  }

                  const busy = busyPhoto === photo.id;
                  return (
                    <View
                      key={photo.id}
                      style={{ width: tileWidth, aspectRatio: 4 / 5, borderRadius: theme.radius.input, overflow: "hidden", ...theme.shadow.card }}
                    >
                      <Image source={{ uri: publicPhotoUrl(photo.storage_path) }} style={{ width: "100%", height: "100%" }} />
                      <Pressable
                        onPress={() => removePhoto(photo)}
                        disabled={busy}
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: "rgba(255,255,255,0.9)",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: busy ? 0.5 : 1,
                        }}
                      >
                        <Ionicons name="close" size={15} color={theme.color.textPrimary} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
              {photoError ? (
                <Text style={[theme.typography.caption, { color: theme.color.error, marginTop: theme.spacing.sm }]}>
                  {photoError}
                </Text>
              ) : null}
            </View>

            <View
              style={{
                backgroundColor: theme.color.surface,
                borderRadius: theme.radius.card,
                padding: theme.spacing.md,
                marginTop: theme.spacing.lg,
                ...theme.shadow.card,
              }}
            >
              <SectionHeader
                title="About Me"
                titleIcon="person-outline"
                action={{ icon: "pencil", label: "", onPress: () => router.push("/(app)/profile/edit") }}
              />
              <Text style={[theme.typography.body, { color: theme.color.textSecondary, marginTop: 8, lineHeight: 24 }]}>
                {extra?.bio || "Add a short bio so people know what makes you, you."}
              </Text>
            </View>

            <View style={{ marginTop: theme.spacing.lg }}>
              <SectionHeader
                title="My Interests"
                titleIcon="sparkles-outline"
                action={{ icon: "pencil", label: "", onPress: () => router.push("/(app)/onboarding/interests") }}
              />
              {extra && extra.interest_tags.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: theme.spacing.sm }}>
                  {extra.interest_tags.map((tag, index) => {
                    const filled = index === 0;
                    return (
                      <View
                        key={tag}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: theme.radius.pill,
                          backgroundColor: filled ? theme.color.primary : theme.color.surfaceVariant,
                        }}
                      >
                        <Ionicons name={interestIcon(tag)} size={16} color={filled ? "#FFFFFF" : theme.color.primary} />
                        <Text style={{ color: filled ? "#FFFFFF" : theme.color.textPrimary, fontSize: 13, fontWeight: "600" }}>
                          {tag.charAt(0).toUpperCase() + tag.slice(1)}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              ) : (
                <Text style={[theme.typography.body, { color: theme.color.textSecondary, marginTop: 8 }]}>
                  Add a few interests to help others find common ground with you.
                </Text>
              )}
            </View>

            {!profile?.is_gold ? (
              <Pressable onPress={() => router.push("/(app)/gold")} style={{ marginTop: theme.spacing.lg }}>
                <LinearGradient
                  colors={theme.color.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: theme.radius.card, padding: theme.spacing.md, overflow: "hidden" }}
                >
                  <View
                    style={{
                      position: "absolute",
                      top: -24,
                      right: -24,
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      backgroundColor: "rgba(255,255,255,0.12)",
                    }}
                  />
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={[theme.typography.title, { color: "#FFFFFF" }]}>Spark Plus</Text>
                    <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                  </View>
                  <Text style={{ color: "rgba(255,255,255,0.9)", marginTop: 2 }}>Unlimited likes & weekly boosts.</Text>
                  <View
                    style={{
                      backgroundColor: theme.color.surface,
                      borderRadius: theme.radius.pill,
                      paddingVertical: 12,
                      alignItems: "center",
                      marginTop: theme.spacing.sm,
                    }}
                  >
                    <Text style={{ color: theme.color.primary, fontWeight: "700" }}>Upgrade Now</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function IconPill({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: theme.color.surfaceSecondary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: theme.radius.pill,
      }}
    >
      <Ionicons name={icon} size={14} color={theme.color.textPrimary} />
      <Text style={{ color: theme.color.textPrimary, fontWeight: "600", fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

function StatCell({ value, label, border }: { value: number; label: string; border?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        borderRightWidth: border ? 1 : 0,
        borderRightColor: theme.color.border,
      }}
    >
      <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>{value}</Text>
      <Text style={{ color: theme.color.textSecondary, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
}

function SectionHeader({
  title,
  titleIcon,
  action,
}: {
  title: string;
  titleIcon?: keyof typeof Ionicons.glyphMap;
  action?: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean };
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {titleIcon ? <Ionicons name={titleIcon} size={16} color={theme.color.textSecondary} /> : null}
        <Text style={[theme.typography.label, { color: theme.color.textPrimary, textTransform: "uppercase", letterSpacing: 0.5 }]}>
          {title}
        </Text>
      </View>
      {action ? (
        action.label ? (
          <Pressable onPress={action.onPress} disabled={action.disabled} style={{ flexDirection: "row", alignItems: "center", gap: 4, opacity: action.disabled ? 0.5 : 1 }}>
            <Ionicons name={action.icon} size={16} color={theme.color.primary} />
            <Text style={{ color: theme.color.primary, fontWeight: "700", fontSize: 12 }}>{action.label}</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={action.onPress}
            disabled={action.disabled}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: theme.color.inputFill,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={action.icon} size={14} color={theme.color.textSecondary} />
          </Pressable>
        )
      ) : null}
    </View>
  );
}
