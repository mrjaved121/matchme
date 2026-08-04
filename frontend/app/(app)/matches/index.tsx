import { useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { ErrorState, LoadingState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { useAuthStore } from "../../../store/authStore";
import { fetchMatches, type MatchListItem } from "../../../lib/queries";
import { fetchWhoLikedMe } from "../../../lib/discover";
import { publicPhotoUrl } from "../../../lib/photoUrl";
import { formatRelativeActive, formatMessageTime } from "../../../lib/formatRelativeActive";

// Matches design/stitch_just_spark_ui_kit/messages/code.html: one unified
// screen (search bar, a "New Matches" avatar strip ending in a liked-you
// tile, then a "Messages" conversation list with a closing nudge line) —
// not the tab-toggle this screen used to have. The toggle is dropped
// because it's redundant here: every match already falls into exactly one
// of the two sections (no conversation yet vs. has one), same as the
// export, so nothing was hidden by removing it.
//
// The empty state blends messages_empty_state/code.html (the correctly
// labeled "zero matches" illustration + copy) with matches_empty_state's
// second CTA ("Boost My Profile") — the Stitch kit's matches_empty_state
// export has a "Settings" header left over from a copy-paste and appears to
// be a discarded draft of the same empty condition, so its best idea is
// folded in rather than building a second, competing empty screen.
export default function ConnectionsScreen() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const [search, setSearch] = useState("");

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
  const query = search.trim().toLowerCase();
  const newMatches = allMatches.filter((m) => !m.lastMessage && (!query || m.otherName?.toLowerCase().includes(query)));
  const conversations = allMatches.filter((m) => m.lastMessage && (!query || m.otherName?.toLowerCase().includes(query)));

  if (allMatches.length === 0) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}>
          <View
            style={{
              width: 128,
              height: 128,
              borderRadius: 64,
              backgroundColor: theme.color.surfaceSecondary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chatbubbles" size={56} color={theme.color.primary} />
          </View>
          <View style={{ gap: 8 }}>
            <Text style={[theme.typography.display, { color: theme.color.textPrimary, textAlign: "center" }]}>
              Your Spark Journey Starts Here
            </Text>
            <Text style={[theme.typography.bodyLg, { color: theme.color.textSecondary, textAlign: "center" }]}>
              The first move is the most exciting. Start matching and messaging to find your perfect spark!
            </Text>
          </View>
          <View style={{ width: "100%", gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            <Button label="Start Swiping" onPress={() => router.push("/(app)/discover")} fullWidth />
            <Button label="Boost My Profile" variant="secondary" onPress={() => router.push("/(app)/boost")} fullWidth />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.matchId}
        ListHeaderComponent={
          <Header
            search={search}
            setSearch={setSearch}
            newMatches={newMatches}
            likersCount={likers?.length ?? 0}
            hasConversations={conversations.length > 0}
          />
        }
        ListFooterComponent={
          conversations.length > 0 ? (
            <View style={{ alignItems: "center", gap: 8, marginTop: theme.spacing.lg, opacity: 0.6 }}>
              <Ionicons name="chatbubble-outline" size={36} color={theme.color.textSecondary} />
              <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center", maxWidth: 240 }]}>
                Keep swiping to discover more kind connections.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => <MatchRow item={item} isLast={index === conversations.length - 1} />}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.color.primary} />}
      />
    </ScreenContainer>
  );
}

function Header({
  search,
  setSearch,
  newMatches,
  likersCount,
  hasConversations,
}: {
  search: string;
  setSearch: (v: string) => void;
  newMatches: MatchListItem[];
  likersCount: number;
  hasConversations: boolean;
}) {
  const theme = useTheme();
  return (
    <View>
      <Text style={[theme.typography.title, { color: theme.color.textPrimary, marginTop: theme.spacing.md, marginBottom: theme.spacing.md }]}>
        Messages
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: theme.color.inputFill,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.md,
          height: 48,
          marginBottom: theme.spacing.lg,
        }}
      >
        <Ionicons name="search" size={18} color={theme.color.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search matches"
          placeholderTextColor={theme.color.textSecondary}
          style={[theme.typography.body, { flex: 1, color: theme.color.textPrimary }]}
        />
      </View>

      {newMatches.length > 0 || likersCount > 0 ? (
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.color.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: theme.spacing.sm },
            ]}
          >
            New Matches
          </Text>
          <FlatList
            data={newMatches}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.matchId}
            contentContainerStyle={{ gap: theme.spacing.md }}
            renderItem={({ item }) => <NewMatchAvatar item={item} />}
            ListFooterComponent={
              likersCount > 0 ? (
                <Pressable onPress={() => router.push("/(app)/liked-you")} style={{ alignItems: "center", width: 72 }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: theme.color.surfaceSecondary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="heart" size={28} color={theme.color.primary} />
                  </View>
                  <Text style={[theme.typography.caption, { color: theme.color.textSecondary, marginTop: 4 }]}>
                    {likersCount} {likersCount === 1 ? "Like" : "Likes"}
                  </Text>
                </Pressable>
              ) : null
            }
          />
        </View>
      ) : null}

      <Text
        style={[
          theme.typography.caption,
          { color: theme.color.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: theme.spacing.sm },
        ]}
      >
        Messages
      </Text>
      {!hasConversations ? (
        <Text style={[theme.typography.body, { color: theme.color.textSecondary, marginBottom: theme.spacing.md }]}>
          Say hello to one of your matches to start a conversation.
        </Text>
      ) : null}
    </View>
  );
}

function NewMatchAvatar({ item }: { item: MatchListItem }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/(app)/matches/[matchId]", params: { matchId: item.matchId } })}
      style={{ alignItems: "center", width: 72 }}
    >
      <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: theme.color.primary }}>
        {item.photoPath ? (
          <Image source={{ uri: publicPhotoUrl(item.photoPath) }} style={{ width: "100%", height: "100%", borderRadius: 30, margin: 2 }} />
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
      </View>
      <Text numberOfLines={1} style={[theme.typography.caption, { color: theme.color.textPrimary, marginTop: 4, fontWeight: "600" }]}>
        {item.otherName ?? "Spark user"}
      </Text>
    </Pressable>
  );
}

function MatchRow({ item, isLast }: { item: MatchListItem; isLast: boolean }) {
  const theme = useTheme();
  const activeLabel = formatRelativeActive(item.otherLastActiveAt);
  const unread = item.unread;

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/(app)/matches/[matchId]", params: { matchId: item.matchId } })}
      style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, paddingVertical: theme.spacing.sm }}
    >
      <View style={{ width: 56, height: 56, borderRadius: 28, overflow: "hidden" }}>
        {item.photoPath ? (
          <Image source={{ uri: publicPhotoUrl(item.photoPath) }} style={{ width: "100%", height: "100%" }} />
        ) : (
          <View style={{ width: "100%", height: "100%", backgroundColor: theme.color.border, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 20 }}>{item.otherName?.[0]?.toUpperCase() ?? "?"}</Text>
          </View>
        )}
        {activeLabel === "Active now" ? (
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: theme.color.primary,
              borderWidth: 2,
              borderColor: theme.color.surface,
            }}
          />
        ) : null}
      </View>

      <View style={{ flex: 1, gap: 2, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: theme.color.border, paddingBottom: theme.spacing.sm }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <Text style={[theme.typography.body, { color: theme.color.textPrimary, fontWeight: "600" }]}>
            {item.otherName ?? "Spark user"}
          </Text>
          <Text style={[theme.typography.caption, { color: unread ? theme.color.primary : theme.color.textSecondary, fontWeight: unread ? "600" : "400" }]}>
            {formatMessageTime(item.lastMessageAt)}
          </Text>
        </View>
        <Text
          numberOfLines={1}
          style={[theme.typography.body, { color: unread ? theme.color.textPrimary : theme.color.textSecondary, fontWeight: unread ? "600" : "400" }]}
        >
          {item.lastMessage ?? "Say hello 👋"}
        </Text>
      </View>
    </Pressable>
  );
}
