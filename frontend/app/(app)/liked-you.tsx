import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { useTheme } from "../../theme/useTheme";
import { useAuthStore } from "../../store/authStore";
import { fetchWhoLikedMe, fetchMySnapshot, recordSwipe, calculateAge, formatDistance, type Liker } from "../../lib/discover";
import { publicPhotoUrl } from "../../lib/photoUrl";

// Matches design/stitch_just_spark_ui_kit/see_who_likes_you/code.html (a
// 2-column card grid, name/age/location on a photo gradient, a heart
// like-back button) and see_who_likes_you_empty_state/code.html (a soft
// icon medallion + "Keep Swiping"/"Boost My Profile"). Free users still see
// the grid, just blurred with a lock — an existing, disclosed addition with
// no export equivalent, since the export doesn't model a paywalled state.
export default function LikedYou() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const profile = useAuthStore((s) => s.profile);
  const isGold = !!profile?.is_gold;
  const [matchingId, setMatchingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["liked-you", myId],
    queryFn: () => fetchWhoLikedMe(myId),
  });

  const { data: me } = useQuery({
    queryKey: ["my-snapshot", myId],
    queryFn: () => fetchMySnapshot(myId),
  });

  async function likeBack(id: string) {
    if (!isGold) {
      router.push("/(app)/gold");
      return;
    }
    setMatchingId(id);
    try {
      const result = await recordSwipe(id, "like");
      if (result.matched && result.match_id) {
        router.replace({
          pathname: "/(app)/match-confirmation/[matchId]",
          params: { matchId: result.match_id, mutual: result.mutual ? "1" : "0" },
        });
      } else {
        refetch();
      }
    } finally {
      setMatchingId(null);
    }
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer>
        <ErrorState onRetry={() => refetch()} />
      </ScreenContainer>
    );
  }

  const likers = data ?? [];

  return (
    <ScreenContainer>
      <View style={{ alignItems: "center", marginTop: theme.spacing.md, marginBottom: theme.spacing.lg }}>
        <Text style={[theme.typography.display, { color: theme.color.textPrimary }]}>Likes You</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <Ionicons name="heart" size={16} color={theme.color.primary} />
          <Text style={[theme.typography.body, { color: theme.color.textSecondary }]}>
            {likers.length} {likers.length === 1 ? "person likes" : "people like"} you
          </Text>
        </View>
      </View>

      {!isGold && likers.length > 0 ? (
        <View
          style={{
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.card,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.color.gold,
          }}
        >
          <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>
            Upgrade to Gold to see who liked you and match instantly.
          </Text>
        </View>
      ) : null}

      {likers.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: theme.color.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="sparkles-outline" size={44} color={theme.color.primary} />
          </View>
          <View style={{ gap: 8 }}>
            <Text style={[theme.typography.title, { color: theme.color.textPrimary, textAlign: "center" }]}>
              No likes yet, but don't give up!
            </Text>
            <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center" }]}>
              The right spark is just a swipe away. Why not try boosting your profile or refining your discovery settings to find more people?
            </Text>
          </View>
          <View style={{ width: "100%", gap: theme.spacing.sm }}>
            <Button label="Keep Swiping" onPress={() => router.push("/(app)/discover")} fullWidth />
            <Button label="Boost My Profile" variant="ghost" onPress={() => router.push("/(app)/boost")} fullWidth />
          </View>
        </View>
      ) : (
        <FlatList
          data={likers}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ gap: theme.spacing.sm }}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.lg }}
          renderItem={({ item }) => (
            <LikerCard
              item={item}
              isGold={isGold}
              distanceLabel={me ? formatDistance(me, item) : item.city}
              busy={matchingId === item.id}
              onLikeBack={() => likeBack(item.id)}
            />
          )}
        />
      )}
    </ScreenContainer>
  );
}

function LikerCard({
  item,
  isGold,
  distanceLabel,
  busy,
  onLikeBack,
}: {
  item: Liker;
  isGold: boolean;
  distanceLabel: string | null;
  busy: boolean;
  onLikeBack: () => void;
}) {
  const theme = useTheme();
  const age = item.birthdate ? calculateAge(item.birthdate) : null;

  return (
    <View style={{ flex: 1, borderRadius: theme.radius.card, overflow: "hidden", backgroundColor: theme.color.surface, ...theme.shadow.card }}>
      <View style={{ width: "100%", aspectRatio: 4 / 5 }}>
        {item.photoPath ? (
          <Image source={{ uri: publicPhotoUrl(item.photoPath) }} blurRadius={isGold ? 0 : 18} style={{ width: "100%", height: "100%" }} cachePolicy="memory-disk" />
        ) : (
          <View style={{ width: "100%", height: "100%", backgroundColor: theme.color.surfaceSecondary }} />
        )}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%" }} />

        {isGold ? (
          <View style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }} numberOfLines={1}>
              {item.first_name ?? "Spark user"}
              {age ? `, ${age}` : ""}
            </Text>
            {distanceLabel ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 }}>
                <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.85)" />
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11 }}>{distanceLabel}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="lock-closed" size={22} color="#FFFFFF" />
          </View>
        )}
      </View>

      <Pressable
        onPress={onLikeBack}
        disabled={busy}
        style={{
          paddingVertical: theme.spacing.sm,
          alignItems: "center",
          justifyContent: "center",
          opacity: busy ? 0.5 : 1,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.color.primary,
            alignItems: "center",
            justifyContent: "center",
            ...theme.shadow.floating,
          }}
        >
          <Ionicons name="heart" size={20} color="#FFFFFF" />
        </View>
      </Pressable>
    </View>
  );
}
