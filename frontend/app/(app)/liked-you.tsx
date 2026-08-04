import { useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "../../components/ScreenContainer";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { useTheme } from "../../theme/useTheme";
import { useAuthStore } from "../../store/authStore";
import { fetchWhoLikedMe } from "../../lib/discover";
import { recordSwipe } from "../../lib/discover";
import { publicPhotoUrl } from "../../lib/photoUrl";

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

  async function likeBack(id: string) {
    if (!isGold) {
      router.push("/(app)/gold");
      return;
    }
    setMatchingId(id);
    try {
      const result = await recordSwipe(id, "like");
      if (result.matched && result.match_id) {
        router.replace({ pathname: "/(app)/match-confirmation/[matchId]", params: { matchId: result.match_id } });
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

  return (
    <ScreenContainer>
      <Text style={[theme.typography.title, { color: theme.color.textPrimary, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm }]}>
        Who liked you
      </Text>

      {!isGold ? (
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

      {!data || data.length === 0 ? (
        <EmptyState title="No likes yet" description="Keep discovering — people who like you will show up here." />
      ) : (
        <FlatList
          data={data}
          numColumns={3}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ gap: theme.spacing.sm }}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.lg }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => likeBack(item.id)}
              disabled={matchingId === item.id}
              style={{ flex: 1, aspectRatio: 3 / 4, borderRadius: theme.radius.card, overflow: "hidden" }}
            >
              {item.photoPath ? (
                <Image
                  source={{ uri: publicPhotoUrl(item.photoPath) }}
                  blurRadius={isGold ? 0 : 18}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <View style={{ width: "100%", height: "100%", backgroundColor: theme.color.border }} />
              )}
              {!isGold ? (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0,0,0,0.25)",
                  }}
                >
                  <Text style={{ fontSize: 22 }}>🔒</Text>
                </View>
              ) : (
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: 6,
                    backgroundColor: "rgba(0,0,0,0.45)",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }} numberOfLines={1}>
                    {item.first_name ?? "Spark user"}
                  </Text>
                </View>
              )}
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}
