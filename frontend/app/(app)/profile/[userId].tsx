import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Tag } from "../../../components/Tag";
import { Button } from "../../../components/Button";
import { LoadingState, ErrorState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";
import { publicPhotoUrl } from "../../../lib/photoUrl";
import { calculateAge, formatDistance, isRecentlyOnline } from "../../../lib/discover";
import { LOOKING_FOR_OPTIONS } from "../../../lib/constants";
import { interestIcon } from "../../../lib/interestIcon";
import { addFavorite, isFavorited, removeFavorite } from "../../../lib/favorites";

type TargetProfile = {
  first_name: string | null;
  birthdate: string | null;
  city: string | null;
  bio: string;
  job_title: string | null;
  education: string | null;
  height_cm: number | null;
  smokes: string | null;
  drinks: string | null;
  looking_for: string | null;
  interest_tags: string[];
  languages: string[];
  religion: string | null;
  is_verified: boolean;
  last_active_at: string | null;
  latitude: number | null;
  longitude: number | null;
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

export default function ViewProfile() {
  const theme = useTheme();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const myId = useAuthStore((s) => s.session!.user.id);
  const queryClient = useQueryClient();
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  const { data: favorited } = useQuery({
    queryKey: ["is-favorited", myId, userId],
    queryFn: () => isFavorited(myId, userId),
  });

  async function toggleFavorite() {
    if (favoriteBusy) return;
    setFavoriteBusy(true);
    try {
      if (favorited) {
        await removeFavorite(myId, userId);
      } else {
        await addFavorite(myId, userId);
      }
      await queryClient.invalidateQueries({ queryKey: ["is-favorited", myId, userId] });
      await queryClient.invalidateQueries({ queryKey: ["favorites", myId] });
    } finally {
      setFavoriteBusy(false);
    }
  }

  const { data: photos } = useQuery({
    queryKey: ["view-profile-photos", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profile_photos")
        .select("storage_path")
        .eq("profile_id", userId)
        .order("position", { ascending: true });
      return data ?? [];
    },
  });

  const { data: myInterests } = useQuery({
    queryKey: ["my-interests-for-common", myId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("interest_tags, latitude, longitude").eq("id", myId).single();
      return { tags: data?.interest_tags ?? [], latitude: data?.latitude ?? null, longitude: data?.longitude ?? null };
    },
  });

  const { data: target, isLoading, isError } = useQuery({
    queryKey: ["view-profile", userId],
    queryFn: async (): Promise<TargetProfile> => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "first_name, birthdate, city, bio, job_title, education, height_cm, smokes, drinks, looking_for, interest_tags, languages, religion, is_verified, last_active_at, latitude, longitude",
        )
        .eq("id", userId)
        .single();
      if (!data) throw new Error("Profile not found");
      return data;
    },
  });

  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    setPhotoIndex(0);
  }, [userId]);

  if (isLoading || !target) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer>
        <ErrorState message="Couldn't load this profile." />
      </ScreenContainer>
    );
  }

  const age = target.birthdate ? calculateAge(target.birthdate) : null;
  const distance = formatDistance(
    { latitude: myInterests?.latitude ?? null, longitude: myInterests?.longitude ?? null },
    { latitude: target.latitude, longitude: target.longitude, city: target.city },
  );
  const online = isRecentlyOnline(target.last_active_at);
  const commonTags = target.interest_tags.filter((t) => myInterests?.tags.includes(t));
  const otherTags = target.interest_tags.filter((t) => !commonTags.includes(t));
  const lookingForLabel = LOOKING_FOR_OPTIONS.find((o) => o.value === target.looking_for)?.label;
  const currentPhoto = photos?.[photoIndex];

  return (
    <ScreenContainer padded={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xl }} showsVerticalScrollIndicator={false}>
        <View style={{ position: "relative" }}>
          {currentPhoto ? (
            <Pressable
              onPress={() => {
                if (!photos || photos.length < 2) return;
                setPhotoIndex((i) => (i + 1) % photos.length);
              }}
            >
              <Image source={{ uri: publicPhotoUrl(currentPhoto.storage_path) }} style={{ width: "100%", aspectRatio: 4 / 5 }} cachePolicy="memory-disk" />
            </Pressable>
          ) : (
            <View style={{ width: "100%", aspectRatio: 4 / 5, backgroundColor: theme.color.surface }} />
          )}

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
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0,0,0,0.5)",
              alignItems: "center",
              justifyContent: "center",
              marginTop: photos && photos.length > 1 ? 14 : 0,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 18 }}>‹</Text>
          </Pressable>

          <View
            style={{
              position: "absolute",
              top: theme.spacing.sm,
              right: theme.spacing.sm,
              flexDirection: "row",
              gap: 8,
              marginTop: photos && photos.length > 1 ? 14 : 0,
            }}
          >
            <Pressable
              onPress={toggleFavorite}
              disabled={favoriteBusy}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(0,0,0,0.5)",
                alignItems: "center",
                justifyContent: "center",
                opacity: favoriteBusy ? 0.6 : 1,
              }}
            >
              <Ionicons name={favorited ? "bookmark" : "bookmark-outline"} size={18} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={() => router.push({ pathname: "/(app)/report/[targetUserId]", params: { targetUserId: userId } })}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(0,0,0,0.5)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 16 }}>⋯</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: theme.spacing.md, marginTop: theme.spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>
              {target.first_name ?? "Spark user"}
              {age ? `, ${age}` : ""}
            </Text>
            {target.is_verified ? <Text style={{ fontSize: 16 }}>🛡️</Text> : null}
            {online ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.color.success }} />
                <Text style={[theme.typography.caption, { color: theme.color.success }]}>Online</Text>
              </View>
            ) : null}
          </View>
          {distance || target.job_title ? (
            <Text style={[theme.typography.subtext, { color: theme.color.textSecondary, marginTop: 2 }]}>
              {[distance, target.job_title].filter(Boolean).join(" · ")}
            </Text>
          ) : null}

          {target.bio ? (
            <Section title="About">
              <Text style={[theme.typography.body, { color: theme.color.textPrimary }]}>{target.bio}</Text>
            </Section>
          ) : null}

          {commonTags.length > 0 ? (
            <Section title="Common Interests">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {commonTags.map((tag, i) => (
                  <Tag key={tag} label={capitalize(tag)} index={i} icon={interestIcon(tag)} />
                ))}
              </View>
            </Section>
          ) : null}

          {otherTags.length > 0 ? (
            <Section title="Interests">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {otherTags.map((tag, i) => (
                  <Tag key={tag} label={capitalize(tag)} index={commonTags.length + i} icon={interestIcon(tag)} />
                ))}
              </View>
            </Section>
          ) : null}

          {lookingForLabel ? (
            <Section title="Relationship Goals">
              <Text style={[theme.typography.body, { color: theme.color.textPrimary }]}>{lookingForLabel}</Text>
            </Section>
          ) : null}

          {target.height_cm || target.education || target.smokes || target.drinks || target.religion || target.languages.length > 0 ? (
            <Section title="Lifestyle">
              <View style={{ gap: 6 }}>
                {target.height_cm ? <FactRow label="Height" value={`${target.height_cm} cm`} /> : null}
                {target.education ? <FactRow label="Education" value={target.education} /> : null}
                {target.religion ? <FactRow label="Religion" value={capitalize(target.religion)} /> : null}
                {target.languages.length > 0 ? <FactRow label="Languages" value={target.languages.map(capitalize).join(", ")} /> : null}
                {target.smokes ? <FactRow label="Smokes" value={capitalize(target.smokes)} /> : null}
                {target.drinks ? <FactRow label="Drinks" value={capitalize(target.drinks)} /> : null}
              </View>
            </Section>
          ) : null}

          <Button
            label="Block or Report"
            variant="ghost"
            textColor={theme.color.error}
            onPress={() => router.push({ pathname: "/(app)/report/[targetUserId]", params: { targetUserId: userId } })}
            style={{ marginTop: theme.spacing.lg }}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ marginTop: theme.spacing.lg }}>
      <Text
        style={[
          theme.typography.caption,
          { color: theme.color.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
        ]}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>{label}</Text>
      <Text style={[theme.typography.subtext, { color: theme.color.textPrimary, fontWeight: "600" }]}>{value}</Text>
    </View>
  );
}
