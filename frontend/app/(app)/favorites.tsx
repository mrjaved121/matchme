import { useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { useTheme } from "../../theme/useTheme";
import { useAuthStore } from "../../store/authStore";
import { fetchFavorites, removeFavorite, type FavoriteProfile } from "../../lib/favorites";
import { calculateAge } from "../../lib/discover";
import { publicPhotoUrl } from "../../lib/photoUrl";

// A personal "save for later" list — profiles bookmarked from the profile
// view screen, independent of liking/matching. Same 2-column card grid
// language as Likes You (see liked-you.tsx), but every card is always fully
// visible (no Gold blur/lock — these are the user's own picks, not a
// paywalled signal) and the action removes instead of likes-back.
export default function Favorites() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const queryClient = useQueryClient();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["favorites", myId],
    queryFn: () => fetchFavorites(myId),
  });

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      await removeFavorite(myId, id);
      await queryClient.invalidateQueries({ queryKey: ["favorites", myId] });
      await queryClient.invalidateQueries({ queryKey: ["is-favorited", myId, id] });
    } finally {
      setRemovingId(null);
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

  const favorites = data ?? [];

  return (
    <ScreenContainer>
      <View style={{ alignItems: "center", marginTop: theme.spacing.md, marginBottom: theme.spacing.lg }}>
        <Text style={[theme.typography.display, { color: theme.color.textPrimary }]}>Favorites</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <Ionicons name="bookmark" size={16} color={theme.color.primary} />
          <Text style={[theme.typography.body, { color: theme.color.textSecondary }]}>
            {favorites.length} saved {favorites.length === 1 ? "profile" : "profiles"}
          </Text>
        </View>
      </View>

      {favorites.length === 0 ? (
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
            <Ionicons name="bookmark-outline" size={44} color={theme.color.primary} />
          </View>
          <View style={{ gap: 8 }}>
            <Text style={[theme.typography.title, { color: theme.color.textPrimary, textAlign: "center" }]}>
              No favorites yet
            </Text>
            <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center" }]}>
              Tap the bookmark icon on someone's profile to save them here and revisit later.
            </Text>
          </View>
          <Button label="Keep Swiping" onPress={() => router.push("/(app)/discover")} fullWidth />
        </View>
      ) : (
        <FlatList
          data={favorites}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ gap: theme.spacing.sm }}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.lg }}
          renderItem={({ item }) => (
            <FavoriteCard
              item={item}
              busy={removingId === item.id}
              onRemove={() => handleRemove(item.id)}
              onOpen={() => router.push({ pathname: "/(app)/profile/[userId]", params: { userId: item.id } })}
            />
          )}
        />
      )}
    </ScreenContainer>
  );
}

function FavoriteCard({
  item,
  busy,
  onRemove,
  onOpen,
}: {
  item: FavoriteProfile;
  busy: boolean;
  onRemove: () => void;
  onOpen: () => void;
}) {
  const theme = useTheme();
  const age = item.birthdate ? calculateAge(item.birthdate) : null;

  return (
    <View style={{ flex: 1, borderRadius: theme.radius.card, overflow: "hidden", backgroundColor: theme.color.surface, ...theme.shadow.card }}>
      <Pressable onPress={onOpen} style={{ width: "100%", aspectRatio: 4 / 5 }}>
        {item.photoPath ? (
          <Image source={{ uri: publicPhotoUrl(item.photoPath) }} style={{ width: "100%", height: "100%" }} />
        ) : (
          <View style={{ width: "100%", height: "100%", backgroundColor: theme.color.surfaceSecondary }} />
        )}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%" }} />

        <View style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }} numberOfLines={1}>
            {item.first_name ?? "Spark user"}
            {age ? `, ${age}` : ""}
          </Text>
          {item.city ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 }}>
              <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.85)" />
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11 }}>{item.city}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <Pressable
        onPress={onRemove}
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
            backgroundColor: theme.color.surfaceSecondary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="bookmark" size={20} color={theme.color.primary} />
        </View>
      </Pressable>
    </View>
  );
}
