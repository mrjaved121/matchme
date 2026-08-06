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
import { fetchMyLikes, calculateAge, type SentLike } from "../../lib/discover";
import { publicPhotoUrl } from "../../lib/photoUrl";
import { formatMessageTime } from "../../lib/formatRelativeActive";

// Same 2-column card grid language as Favorites/Likes You, but this one is
// a history of everyone the caller has swiped like/superlike on. Liking now
// unlocks a match immediately, so unlike Likes You (incoming, still
// pending) this list isn't gated by match status -- it's a plain record,
// and most rows here already have a live conversation in Messages too.
export default function MyLikes() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-likes", myId],
    queryFn: () => fetchMyLikes(myId),
  });

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

  const likes = data ?? [];

  return (
    <ScreenContainer>
      <View style={{ alignItems: "center", marginTop: theme.spacing.md, marginBottom: theme.spacing.lg }}>
        <Text style={[theme.typography.display, { color: theme.color.textPrimary }]}>My Likes</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <Ionicons name="heart" size={16} color={theme.color.primary} />
          <Text style={[theme.typography.body, { color: theme.color.textSecondary }]}>
            {likes.length} {likes.length === 1 ? "person liked" : "people liked"}
          </Text>
        </View>
      </View>

      {likes.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: theme.color.primary + "1A",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="heart-outline" size={44} color={theme.color.primary} />
          </View>
          <View style={{ gap: 8 }}>
            <Text style={[theme.typography.title, { color: theme.color.textPrimary, textAlign: "center" }]}>
              No likes sent yet
            </Text>
            <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center" }]}>
              Everyone you like will show up here — and liking someone opens a conversation right away.
            </Text>
          </View>
          <Button label="Start Swiping" onPress={() => router.push("/(app)/discover")} fullWidth />
        </View>
      ) : (
        <FlatList
          data={likes}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ gap: theme.spacing.sm }}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.lg }}
          renderItem={({ item }) => (
            <LikeCard item={item} onOpen={() => router.push({ pathname: "/(app)/profile/[userId]", params: { userId: item.id } })} />
          )}
        />
      )}
    </ScreenContainer>
  );
}

function LikeCard({ item, onOpen }: { item: SentLike; onOpen: () => void }) {
  const theme = useTheme();
  const age = item.birthdate ? calculateAge(item.birthdate) : null;

  return (
    <Pressable
      onPress={onOpen}
      style={{ flex: 1, borderRadius: theme.radius.card, overflow: "hidden", backgroundColor: theme.color.surface, ...theme.shadow.card }}
    >
      <View style={{ width: "100%", aspectRatio: 4 / 5 }}>
        {item.photoPath ? (
          <Image source={{ uri: publicPhotoUrl(item.photoPath) }} style={{ width: "100%", height: "100%" }} cachePolicy="memory-disk" />
        ) : (
          <View style={{ width: "100%", height: "100%", backgroundColor: theme.color.surfaceSecondary }} />
        )}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%" }} />

        {item.superlike ? (
          <View
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              backgroundColor: theme.swipe.superlike,
              borderRadius: theme.radius.pill,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Ionicons name="star" size={11} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "700" }}>Super Like</Text>
          </View>
        ) : null}

        <View style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }} numberOfLines={1}>
            {item.first_name ?? "Spark user"}
            {age ? `, ${age}` : ""}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 }}>
            {item.city ? (
              <>
                <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.85)" />
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11 }} numberOfLines={1}>
                  {item.city} · {formatMessageTime(item.likedAt)}
                </Text>
              </>
            ) : (
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11 }}>{formatMessageTime(item.likedAt)}</Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
