import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { LoadingState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";
import { publicPhotoUrl } from "../../../lib/photoUrl";

type Person = { firstName: string | null; photoPath: string | null; interestTags: string[] };

const ICEBREAKERS = [
  "If you could live anywhere for a month, where? 🌍",
  "What's your go-to order at your favorite restaurant?",
  "Coffee or tea person? Defend your answer.",
  "What's the best trip you've ever taken?",
  "Dogs, cats, or neither?",
];

function Avatar({ person, size, borderColor }: { person: Person | null; size: number; borderColor: string }) {
  return person?.photoPath ? (
    <Image
      source={{ uri: publicPhotoUrl(person.photoPath) }}
      style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor }}
      cachePolicy="memory-disk"
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor,
        backgroundColor: "rgba(255,255,255,0.12)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.4, fontWeight: "800", color: "#FFFFFF" }}>
        {person?.firstName?.[0]?.toUpperCase() ?? "?"}
      </Text>
    </View>
  );
}

export default function MatchConfirmation() {
  const theme = useTheme();
  const { matchId, mutual } = useLocalSearchParams<{ matchId: string; mutual?: string }>();
  const isMutual = mutual !== "0";
  const myId = useAuthStore((s) => s.session!.user.id);

  const leftSlide = useRef(new Animated.Value(-140)).current;
  const rightSlide = useRef(new Animated.Value(140)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  const [me, setMe] = useState<Person | null>(null);
  const [other, setOther] = useState<Person | null>(null);
  const [otherName, setOtherName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const icebreaker = useMemo(() => ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)], []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: match } = await supabase
        .from("matches")
        .select("user_a_id, user_b_id")
        .eq("id", matchId)
        .single();

      if (cancelled || !match) {
        setLoading(false);
        return;
      }

      const otherId = match.user_a_id === myId ? match.user_b_id : match.user_a_id;

      const [{ data: profiles }, { data: photos }] = await Promise.all([
        supabase.from("profiles").select("id, first_name, interest_tags").in("id", [myId, otherId]),
        supabase
          .from("profile_photos")
          .select("profile_id, storage_path")
          .in("profile_id", [myId, otherId])
          .eq("position", 0),
      ]);

      if (cancelled) return;

      const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
      const photoById = new Map((photos ?? []).map((p) => [p.profile_id, p.storage_path]));

      const myProfile = profileById.get(myId);
      const otherProfile = profileById.get(otherId);

      setMe({
        firstName: myProfile?.first_name ?? null,
        photoPath: photoById.get(myId) ?? null,
        interestTags: myProfile?.interest_tags ?? [],
      });
      setOther({
        firstName: otherProfile?.first_name ?? null,
        photoPath: photoById.get(otherId) ?? null,
        interestTags: otherProfile?.interest_tags ?? [],
      });
      setOtherName(otherProfile?.first_name ?? null);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [matchId, myId]);

  useEffect(() => {
    if (loading) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.parallel([
      Animated.spring(leftSlide, { toValue: 0, useNativeDriver: true, friction: 6 }),
      Animated.spring(rightSlide, { toValue: 0, useNativeDriver: true, friction: 6 }),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, delay: 150, useNativeDriver: true }),
    ]).start();
  }, [loading, leftSlide, rightSlide, textOpacity]);

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  const sharedTags = (me?.interestTags ?? []).filter((tag) => (other?.interestTags ?? []).includes(tag));

  return (
    <ScreenContainer padded={false}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        <Ionicons name="heart" size={40} color={theme.color.primary} />

        <View style={{ flexDirection: "row" }}>
          <Animated.View style={{ marginRight: -22, zIndex: 1, transform: [{ translateX: leftSlide }, { rotate: "-6deg" }] }}>
            <Avatar person={me} size={104} borderColor={theme.color.primary} />
          </Animated.View>
          <Animated.View style={{ transform: [{ translateX: rightSlide }, { rotate: "6deg" }] }}>
            <Avatar person={other} size={104} borderColor={theme.color.primary} />
          </Animated.View>
        </View>

        <Animated.Text
          style={[
            theme.typography.display,
            { color: theme.color.primaryGradient[1], textAlign: "center", fontSize: 34, fontWeight: "800", opacity: textOpacity },
          ]}
        >
          {isMutual ? "It's a Match!" : "You Can Chat Now!"}
        </Animated.Text>
        <Animated.Text style={{ color: theme.color.textSecondary, fontSize: 16, textAlign: "center", opacity: textOpacity }}>
          {isMutual
            ? `You and ${otherName ?? "your match"} liked each other`
            : `Say hi to ${otherName ?? "them"} — your conversation is open`}
        </Animated.Text>

        {sharedTags.length > 0 ? (
          <Animated.View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", opacity: textOpacity }}>
            {sharedTags.slice(0, 4).map((tag) => (
              <View
                key={tag}
                style={{
                  backgroundColor: theme.color.primary + "22",
                  borderRadius: theme.radius.pill,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: theme.color.primary, fontWeight: "700", fontSize: 13 }}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </Text>
              </View>
            ))}
          </Animated.View>
        ) : null}

        <Animated.View
          style={{
            width: "100%",
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.card,
            padding: theme.spacing.md,
            marginTop: theme.spacing.sm,
            opacity: textOpacity,
          }}
        >
          <Text style={[theme.typography.caption, { color: theme.color.textSecondary, fontWeight: "700", letterSpacing: 0.5 }]}>
            TRY AN ICEBREAKER 🧊
          </Text>
          <Text style={[theme.typography.body, { color: theme.color.textPrimary, marginTop: 4 }]}>
            "{icebreaker}"
          </Text>
        </Animated.View>

        <Animated.View style={{ width: "100%", gap: theme.spacing.sm, marginTop: theme.spacing.md, opacity: textOpacity }}>
          <Button
            label="Send a Message 💬"
            variant="primary"
            onPress={() => router.replace({ pathname: "/(app)/matches/[matchId]", params: { matchId } })}
          />
          <Button label="Keep Swiping 🔥" variant="ghost" onPress={() => router.replace("/(app)/discover")} />
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}
