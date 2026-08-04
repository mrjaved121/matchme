import { useState } from "react";
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

type Tab = "matches" | "messages";

export default function ConnectionsScreen() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const [tab, setTab] = useState<Tab>("matches");

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

  const allMatches = data ?? [];
  const newMatches = allMatches.filter((m) => !m.lastMessage);
  const conversations = allMatches.filter((m) => m.lastMessage);

  const header = (
    <View>
      <Text
        style={[
          theme.typography.title,
          { color: theme.color.textPrimary, marginTop: theme.spacing.md, marginBottom: theme.spacing.md },
        ]}
      >
        Connections
      </Text>

      <View
        style={{
          flexDirection: "row",
          backgroundColor: theme.color.surface,
          borderRadius: theme.radius.pill,
          padding: 4,
          marginBottom: theme.spacing.md,
        }}
      >
        <TabButton label="Matches" active={tab === "matches"} onPress={() => setTab("matches")} />
        <TabButton label="Messages" active={tab === "messages"} onPress={() => setTab("messages")} />
      </View>

      {tab === "matches" && likers && likers.length > 0 ? (
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

      {tab === "matches" && newMatches.length > 0 ? (
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.color.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: theme.spacing.sm },
            ]}
          >
            New Matches · {newMatches.length}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md }}>
            {newMatches.map((item) => (
              <NewMatchAvatar key={item.matchId} item={item} />
            ))}
          </View>
        </View>
      ) : null}

      {tab === "matches" && newMatches.length === 0 && conversations.length > 0 ? (
        <Text style={[theme.typography.subtext, { color: theme.color.textSecondary, marginBottom: theme.spacing.md }]}>
          You've said hi to all your matches — check Messages for your conversations.
        </Text>
      ) : null}
    </View>
  );

  const listData = tab === "matches" ? allMatches : conversations;

  if (listData.length === 0) {
    return (
      <ScreenContainer>
        {header}
        <EmptyState
          title={tab === "matches" ? "No matches yet" : "No conversations yet"}
          description={
            tab === "matches"
              ? "Start discovering people, or jump into a speed date."
              : "Say hello to one of your matches to start a conversation."
          }
          actionLabel="Go to Discover"
          onAction={() => router.push("/(app)/discover")}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={tab === "messages" ? conversations : []}
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

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: "center",
        paddingVertical: 10,
        borderRadius: theme.radius.pill,
        backgroundColor: active ? theme.color.primary : "transparent",
      }}
    >
      <Text style={{ color: active ? "#FFFFFF" : theme.color.textSecondary, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

function NewMatchAvatar({ item }: { item: MatchListItem }) {
  const theme = useTheme();
  const isOnline = formatRelativeActive(item.otherLastActiveAt) === "Active now";

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/(app)/matches/[matchId]", params: { matchId: item.matchId } })}
      style={{ alignItems: "center", width: 72 }}
    >
      <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: theme.color.primary }}>
        {item.photoPath ? (
          <Image
            source={{ uri: publicPhotoUrl(item.photoPath) }}
            style={{ width: "100%", height: "100%", borderRadius: 30, margin: 2 }}
          />
        ) : (
          <View
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 30,
              margin: 2,
              backgroundColor: theme.color.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 20 }}>{item.otherName?.[0]?.toUpperCase() ?? "?"}</Text>
          </View>
        )}
        {isOnline ? (
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: theme.color.success,
              borderWidth: 2,
              borderColor: theme.color.background,
            }}
          />
        ) : null}
      </View>
      <Text
        numberOfLines={1}
        style={[theme.typography.caption, { color: theme.color.textPrimary, marginTop: 4, fontWeight: "600" }]}
      >
        {item.otherName ?? "Spark user"}
      </Text>
    </Pressable>
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
            {item.otherName ?? "Spark user"}
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
