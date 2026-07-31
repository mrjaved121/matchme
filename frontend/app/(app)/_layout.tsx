import { useEffect } from "react";
import { Redirect, Tabs } from "expo-router";
import { ColorValue, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { useTheme } from "../../theme/useTheme";
import { registerPushToken } from "../../lib/registerPushToken";
import { fetchMatches } from "../../lib/queries";

function TabIcon({ symbol, focused, color }: { symbol: string; focused: boolean; color: ColorValue }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6, color }}>{symbol}</Text>;
}

export default function AppLayout() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const theme = useTheme();

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  if (!profile?.onboarding_completed) {
    return <Redirect href="/onboarding" />;
  }

  return <AppTabs userId={session.user.id} theme={theme} />;
}

function AppTabs({ userId, theme }: { userId: string; theme: ReturnType<typeof useTheme> }) {
  useEffect(() => {
    registerPushToken(userId).catch(() => {});
  }, [userId]);

  // Shares the "matches" query cache with the Matches screen, so reading a
  // chat there clears this badge without a dedicated endpoint.
  const { data: matches } = useQuery({
    queryKey: ["matches", userId],
    queryFn: () => fetchMatches(userId),
    refetchInterval: 30_000,
  });
  const unreadCount = matches?.filter((m) => m.unread).length ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.primary,
        tabBarInactiveTintColor: theme.color.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.color.surface,
          borderTopColor: theme.color.border,
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{ title: "Discover", tabBarIcon: (p) => <TabIcon symbol="◈" {...p} /> }}
      />
      <Tabs.Screen
        name="matches/index"
        options={{
          title: "Matches",
          tabBarIcon: (p) => <TabIcon symbol="♥" {...p} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.color.primary },
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{ title: "Profile", tabBarIcon: (p) => <TabIcon symbol="◐" {...p} /> }}
      />

      {/* Reachable via router.push, hidden from the tab bar */}
      <Tabs.Screen name="home" options={{ href: null }} />
      <Tabs.Screen name="queue" options={{ href: null }} />
      <Tabs.Screen name="preference-filter" options={{ href: null }} />
      <Tabs.Screen name="date/[sessionId]" options={{ href: null }} />
      <Tabs.Screen name="decision/[sessionId]" options={{ href: null }} />
      <Tabs.Screen name="match-confirmation/[matchId]" options={{ href: null }} />
      <Tabs.Screen name="matches/[matchId]" options={{ href: null }} />
      <Tabs.Screen name="profile/edit" options={{ href: null }} />
      <Tabs.Screen name="profile/photos" options={{ href: null }} />
      <Tabs.Screen name="settings/index" options={{ href: null }} />
      <Tabs.Screen name="settings/notifications" options={{ href: null }} />
      <Tabs.Screen name="settings/privacy" options={{ href: null }} />
      <Tabs.Screen name="settings/verification" options={{ href: null }} />
      <Tabs.Screen name="settings/blocked" options={{ href: null }} />
      <Tabs.Screen name="settings/safety" options={{ href: null }} />
      <Tabs.Screen name="settings/subscription" options={{ href: null }} />
      <Tabs.Screen name="settings/help" options={{ href: null }} />
      <Tabs.Screen name="report/[targetUserId]" options={{ href: null }} />
      <Tabs.Screen name="gold" options={{ href: null }} />
      <Tabs.Screen name="boost" options={{ href: null }} />
      <Tabs.Screen name="liked-you" options={{ href: null }} />
      <Tabs.Screen name="discovery-preferences" options={{ href: null }} />
    </Tabs>
  );
}
