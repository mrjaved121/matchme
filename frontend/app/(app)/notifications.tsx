import { FlatList, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { useTheme } from "../../theme/useTheme";
import { useAuthStore } from "../../store/authStore";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "../../lib/notifications";
import { formatMessageTime } from "../../lib/formatRelativeActive";

// A real in-app notification feed, backing the bell icon on the Profile hub.
// Populated server-side only (a trigger on new messages, and record_swipe on
// a new match) — this screen just reads and marks-as-read.
export default function Notifications() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications", myId],
    queryFn: () => fetchNotifications(myId),
  });

  async function refreshBadges() {
    await queryClient.invalidateQueries({ queryKey: ["notifications", myId] });
    await queryClient.invalidateQueries({ queryKey: ["notifications-unread", myId] });
  }

  async function openNotification(item: AppNotification) {
    if (!item.is_read) {
      await markNotificationRead(item.id);
      refreshBadges();
    }
    if (item.related_match_id) {
      router.push({ pathname: "/(app)/matches/[matchId]", params: { matchId: item.related_match_id } });
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead(myId);
    refreshBadges();
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

  const notifications = data ?? [];
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <ScreenContainer>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>Notifications</Text>
        {hasUnread ? (
          <Pressable onPress={handleMarkAllRead}>
            <Text style={{ color: theme.color.primary, fontWeight: "700", fontSize: 13 }}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      {notifications.length === 0 ? (
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
            <Ionicons name="notifications-outline" size={44} color={theme.color.primary} />
          </View>
          <View style={{ gap: 8 }}>
            <Text style={[theme.typography.title, { color: theme.color.textPrimary, textAlign: "center" }]}>
              Nothing here yet
            </Text>
            <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center" }]}>
              New matches and messages will show up here.
            </Text>
          </View>
          <Button label="Start Swiping" onPress={() => router.push("/(app)/discover")} fullWidth />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
          renderItem={({ item, index }) => (
            <NotificationRow item={item} isLast={index === notifications.length - 1} onPress={() => openNotification(item)} />
          )}
        />
      )}
    </ScreenContainer>
  );
}

function NotificationRow({ item, isLast, onPress }: { item: AppNotification; isLast: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.color.border,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: item.type === "match" ? theme.color.primary + "1A" : theme.color.surfaceSecondary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={item.type === "match" ? "heart" : "chatbubble-ellipses"}
          size={18}
          color={item.type === "match" ? theme.color.primary : theme.color.textSecondary}
        />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <Text
            numberOfLines={1}
            style={[theme.typography.body, { flex: 1, color: theme.color.textPrimary, fontWeight: item.is_read ? "400" : "700" }]}
          >
            {item.title}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.color.textSecondary, marginLeft: 8 }]}>
            {formatMessageTime(item.created_at)}
          </Text>
        </View>
        <Text numberOfLines={2} style={[theme.typography.body, { color: theme.color.textSecondary }]}>
          {item.body}
        </Text>
      </View>

      {!item.is_read ? (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.color.primary, marginTop: 6 }} />
      ) : null}
    </Pressable>
  );
}
