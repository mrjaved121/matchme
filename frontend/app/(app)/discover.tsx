import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "../../components/ScreenContainer";
import { EmptyState, ErrorState, LoadingState, NoInternetState } from "../../components/StateViews";
import { useIsOnline } from "../../lib/useIsOnline";
import { SwipeCard, type SwipeCardHandle, type SwipeCardProfile } from "../../components/SwipeCard";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { publicPhotoUrl } from "../../lib/photoUrl";
import {
  applyAdvancedFilters,
  calculateAge,
  captureAndSaveLocation,
  computeCompatibility,
  fetchDiscoverCandidates,
  fetchMySnapshot,
  formatDistance,
  isRecentlyOnline,
  recordSwipe,
  type SwipeAction,
} from "../../lib/discover";

export default function Discover() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const profile = useAuthStore((s) => s.profile);

  const [deck, setDeck] = useState<SwipeCardProfile[] | null>(null);
  const [error, setError] = useState(false);
  const isOnline = useIsOnline();
  const [busy, setBusy] = useState(false);
  const [topPicksActive, setTopPicksActive] = useState(false);
  const topCardRef = useRef<SwipeCardHandle>(null);

  const load = useCallback(async () => {
    setError(false);
    setDeck(null);
    try {
      const [rawCandidates, me] = await Promise.all([fetchDiscoverCandidates(20), fetchMySnapshot(myId)]);
      const candidates = applyAdvancedFilters(me, rawCandidates);
      const ids = candidates.map((c) => c.id);
      const { data: photos } =
        ids.length > 0
          ? await supabase.from("profile_photos").select("profile_id, storage_path").in("profile_id", ids).order("position", { ascending: true })
          : { data: [] };

      const photosByProfile = new Map<string, string[]>();
      for (const p of photos ?? []) {
        const list = photosByProfile.get(p.profile_id) ?? [];
        list.push(publicPhotoUrl(p.storage_path));
        photosByProfile.set(p.profile_id, list);
      }

      setDeck(
        candidates.map((c) => ({
          id: c.id,
          first_name: c.first_name,
          bio: c.bio,
          age: c.show_age && c.birthdate ? calculateAge(c.birthdate) : null,
          distanceLabel: c.show_distance ? formatDistance(me, c) : null,
          job_title: c.job_title,
          loveLanguage: c.love_language,
          interest_tags: c.interest_tags ?? [],
          is_verified: c.is_verified,
          isOnline: isRecentlyOnline(c.last_active_at),
          matchScore: computeCompatibility(me, c),
          photoUrls: photosByProfile.get(c.id) ?? [],
        })),
      );
    } catch {
      setError(true);
    }
  }, [myId]);

  useEffect(() => {
    load();
    captureAndSaveLocation(myId);
  }, [load, myId]);

  async function handleSwiped(profileId: string, action: SwipeAction) {
    setBusy(true);
    setDeck((prev) => (prev ? prev.filter((p) => p.id !== profileId) : prev));

    try {
      const result = await recordSwipe(profileId, action);
      if (action !== "pass") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
      if (result.matched && result.match_id) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        router.push({ pathname: "/(app)/match-confirmation/[matchId]", params: { matchId: result.match_id } });
      }
    } catch (e) {
      // The card already flew off-screen visually; since the swipe was never
      // recorded server-side when a limit is hit, this candidate will simply
      // reappear in the deck next load — no local undo needed.
      const message = e instanceof Error ? e.message : "";
      if (message.includes("daily_superlike_limit_reached")) {
        router.push({ pathname: "/(app)/out-of-likes", params: { type: "superlike" } });
      } else if (message.includes("daily_like_limit_reached")) {
        router.push({ pathname: "/(app)/out-of-likes", params: { type: "like" } });
      }
    } finally {
      setBusy(false);
    }
  }

  function bringToFront(profileId: string) {
    setDeck((prev) => {
      if (!prev) return prev;
      const target = prev.find((p) => p.id === profileId);
      if (!target) return prev;
      return [target, ...prev.filter((p) => p.id !== profileId)];
    });
  }

  function openPassport() {
    if (!profile?.is_gold) {
      router.push("/(app)/gold");
      return;
    }
    router.push("/(app)/discovery-preferences");
  }

  if (error) {
    return (
      <ScreenContainer>
        {isOnline === false ? <NoInternetState onRetry={load} /> : <ErrorState onRetry={load} />}
      </ScreenContainer>
    );
  }

  if (!deck) {
    return (
      <ScreenContainer>
        <LoadingState label="Finding people nearby…" />
      </ScreenContainer>
    );
  }

  const orderedDeck = topPicksActive ? [...deck].sort((a, b) => b.matchScore - a.matchScore) : deck;
  const visible = orderedDeck.slice(0, 3);
  const stripCandidates = orderedDeck.slice(0, 8);

  return (
    <ScreenContainer>
      <View style={{ flex: 1, paddingTop: theme.spacing.sm }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: theme.spacing.sm,
          }}
        >
          <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>Discover</Text>
          <Pressable
            onPress={() => router.push("/(app)/preference-filter")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.color.surface,
              borderWidth: 1,
              borderColor: theme.color.border,
            }}
          >
            <Text style={{ fontSize: 14 }}>⏱</Text>
            <Text style={[theme.typography.caption, { color: theme.color.textPrimary, fontWeight: "700" }]}>
              Speed Date
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingBottom: theme.spacing.sm, alignItems: "center" }}
        >
          <QuickAccessCircle
            label="Top Picks"
            icon="★"
            iconColor={theme.color.gold}
            active={topPicksActive}
            onPress={() => setTopPicksActive((v) => !v)}
          />
          <QuickAccessCircle label="Passport" icon="🌐" iconColor={theme.swipe.superlike} onPress={openPassport} />
          {stripCandidates.map((c) => (
            <Pressable key={c.id} onPress={() => bringToFront(c.id)} style={{ alignItems: "center", gap: 4, width: 64 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  borderWidth: 2,
                  borderColor: c.isOnline ? theme.swipe.like : theme.color.border,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.color.surface,
                }}
              >
                {c.photoUrls[0] ? (
                  <Image source={{ uri: c.photoUrls[0] }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <Text style={{ color: theme.color.textSecondary, fontWeight: "700" }}>
                    {c.first_name?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                )}
              </View>
              <Text numberOfLines={1} style={[theme.typography.caption, { color: theme.color.textSecondary }]}>
                {c.first_name ?? "—"}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ flex: 1 }}>
          {visible.length === 0 ? (
            <EmptyState
              title="You're all caught up"
              description="No new people right now — check back soon, or widen your discovery preferences."
              actionLabel="Refresh"
              onAction={load}
            />
          ) : (
            [...visible].reverse().map((p, i) => {
              const isTop = i === visible.length - 1;
              return (
                <SwipeCard
                  key={p.id}
                  ref={isTop ? topCardRef : undefined}
                  profile={p}
                  isTop={isTop}
                  onSwiped={(action) => handleSwiped(p.id, action)}
                />
              );
            })
          )}
        </View>

        {visible.length > 0 ? (
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 16, paddingVertical: theme.spacing.lg }}>
            <ActionButton symbol="↺" color={theme.swipe.rewind} size={44} onPress={() => {}} disabled />
            <ActionButton symbol="✕" color={theme.swipe.pass} size={56} onPress={() => !busy && topCardRef.current?.swipe("pass")} />
            <ActionButton symbol="★" color={theme.swipe.superlike} size={44} onPress={() => !busy && topCardRef.current?.swipe("superlike")} />
            <ActionButton symbol="♥" color={theme.swipe.like} size={56} onPress={() => !busy && topCardRef.current?.swipe("like")} />
            <ActionButton symbol="⚡" color={theme.swipe.boost} size={44} onPress={() => router.push("/(app)/boost")} />
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

function QuickAccessCircle({
  label,
  icon,
  iconColor,
  active,
  onPress,
}: {
  label: string;
  icon: string;
  iconColor: string;
  active?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center", gap: 4, width: 64 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: active ? iconColor + "33" : theme.color.surface,
          borderWidth: active ? 2 : 0,
          borderColor: iconColor,
        }}
      >
        <Text style={{ fontSize: 22, color: iconColor }}>{icon}</Text>
      </View>
      <Text numberOfLines={1} style={[theme.typography.caption, { color: theme.color.textSecondary, fontWeight: "700" }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ActionButton({
  symbol,
  color,
  size,
  onPress,
  disabled,
}: {
  symbol: string;
  color: string;
  size: number;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.color.surface,
        opacity: disabled ? 0.4 : 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <Text style={{ fontSize: size * 0.4, color }}>{symbol}</Text>
    </Pressable>
  );
}
