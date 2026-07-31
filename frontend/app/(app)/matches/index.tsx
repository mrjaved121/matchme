import { FlatList, Image, Pressable, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { EmptyState, ErrorState, LoadingState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { useAuthStore } from "../../../store/authStore";
import { fetchMatches, type MatchListItem } from "../../../lib/queries";
import { fetchWhoLikedMe } from "../../../lib/discover";
import { publicPhotoUrl } from "../../../lib/photoUrl";
import { formatRelativeActive } from "../../../lib/formatRelativeActive";

export default function MatchesList() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);

  const { data, isLoading, isError, isRefetching, refetch } = useQuery({
    queryKey: ["matches", myId],
    queryFn: () => fetchMatches(myId),
  });

  const { data: likers } = useQuery({
    queryKey: ["liked-you", myId],
    queryFn: () => fetchWhoLikedMe(myId),
  });

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState label="Loading your matches…" />
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

  const header = (
    <View>
      <Text
        style={[
          theme.typography.title,
          { color: theme.color.textPrimary, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
        ]}
      >
        Matches
      </Text>
      {likers && likers.length > 0 ? (
        <Pressable
          onPress={() => router.push("/(app)/liked-you")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.card,
            borderWidth: 1,
            borderColor: theme.color.gold,
            padding: theme.spacing.sm,
            marginBottom: theme.spacing.md,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={[theme.typography.body, { color: theme.color.textPrimary, fontWeight: "700" }]}>
              Who Liked You
            </Text>
            <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>
              {likers.length} {likers.length === 1 ? "person" : "people"} liked your profile
            </Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            {likers.slice(0, 3).map((liker, index) => (
              <View
                key={liker.id}
                style={{
                  marginLeft: index === 0 ? 0 : -12,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  overflow: "hidden",
                  borderWidth: 2,
                  borderColor: theme.color.surface,
                }}
              >
                {liker.photoPath ? (
                  <Image source={{ uri: publicPhotoUrl(liker.photoPath) }} blurRadius={12} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <View style={{ width: "100%", height: "100%", backgroundColor: theme.color.border }} />
                )}
              </View>
            ))}
          </View>
        </Pressable>
      ) : null}
    </View>
  );

  if (!data || data.length === 0) {
    return (
      <ScreenContainer>
        {header}
        <EmptyState
          title="No matches yet"
          description="Start discovering people, or jump into a speed date."
          actionLabel="Go to Discover"
          onAction={() => router.push("/(app)/discover")}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={data}
        keyExtractor={(item) => item.matchId}
        ListHeaderComponent={header}
        contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.lg }}
        renderItem={({ item }) => <MatchRow item={item} />}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.color.primary} />
        }
      />
    </ScreenContainer>
  );
}

function MatchRow({ item }: { item: MatchListItem }) {
  const theme = useTheme();
  const activeLabel = formatRelativeActive(item.otherLastActiveAt);

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/(app)/matches/[matchId]", params: { matchId: item.matchId } })
      }
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        padding: theme.spacing.sm,
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.card,
        borderWidth: 1,
        borderColor: theme.color.border,
      }}
    >
      {item.photoPath ? (
        <Image
          source={{ uri: publicPhotoUrl(item.photoPath) }}
          style={{ width: 56, height: 56, borderRadius: 28 }}
        />
      ) : (
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.color.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 20 }}>{item.otherName?.[0]?.toUpperCase() ?? "?"}</Text>
        </View>
      )}

      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[theme.typography.body, { color: theme.color.textPrimary, fontWeight: "700" }]}>
            {item.otherName ?? "MatchMe user"}
          </Text>
          {activeLabel ? (
            <Text
              style={[
                theme.typography.caption,
                { color: activeLabel === "Active now" ? theme.color.success : theme.color.textSecondary },
              ]}
            >
              {activeLabel}
            </Text>
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          style={[theme.typography.subtext, { color: theme.color.textSecondary }]}
        >
          {item.lastMessage ?? "Say hello 👋"}
        </Text>
      </View>

      {item.unread ? (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: theme.color.primary,
          }}
        />
      ) : null}
    </Pressable>
  );
}
