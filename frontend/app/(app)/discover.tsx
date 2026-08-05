import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { ErrorState, LoadingState, NoInternetState } from "../../components/StateViews";
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
  rewindLastSwipe,
  type SwipeAction,
} from "../../lib/discover";

const FREE_REWINDS_PER_SESSION = 1;

export default function Discover() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const isGold = useAuthStore((s) => s.profile?.is_gold ?? false);

  const [deck, setDeck] = useState<SwipeCardProfile[] | null>(null);
  const [error, setError] = useState(false);
  const isOnline = useIsOnline();
  const [busy, setBusy] = useState(false);
  const topCardRef = useRef<SwipeCardHandle>(null);
  const [lastSwiped, setLastSwiped] = useState<SwipeCardProfile | null>(null);
  const rewindsUsed = useRef(0);

  const load = useCallback(async () => {
    setError(false);
    setDeck(null);
    setLastSwiped(null);
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
    captureAndSaveLocation(myId);
  }, [myId]);

  // Refetch on focus (not just mount) so returning from Discovery
  // Preferences or Boost — the two actions offered when the deck runs dry —
  // actually shows a refreshed deck instead of the same empty state.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleSwiped(profileId: string, action: SwipeAction) {
    setBusy(true);
    setLastSwiped(deck?.find((p) => p.id === profileId) ?? null);
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

  async function handleRewind() {
    if (busy || !lastSwiped) return;

    if (!isGold && rewindsUsed.current >= FREE_REWINDS_PER_SESSION) {
      router.push("/(app)/gold");
      return;
    }

    setBusy(true);
    const profile = lastSwiped;
    try {
      await rewindLastSwipe();
      rewindsUsed.current += 1;
      setLastSwiped(null);
      setDeck((prev) => (prev ? [profile, ...prev] : prev));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      if (message.includes("cannot_rewind_a_match")) {
        Alert.alert("Can't rewind", "You already matched with this person.");
      } else if (!message.includes("no_swipe_to_rewind")) {
        Alert.alert("Couldn't rewind", "Please try again.");
      }
    } finally {
      setBusy(false);
    }
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

  const visible = deck.slice(0, 3);

  // Structure matches design/stitch_just_spark_ui_kit/discover/code.html: no
  // header, no quick-access row — just the card (16px inset, 112px reserved
  // at the bottom) with the 5 action buttons overlaid on top of it. The
  // filter icon is the one addition beyond the literal export — nothing in
  // the kit puts filter access anywhere reachable while actively swiping, so
  // it's a minimal circular icon button matching the kit's own header-button
  // style (e.g. the notification bell on Messages/Profile) rather than new
  // chrome.
  return (
    <ScreenContainer padded={false}>
      <View style={{ flex: 1 }}>
        <Pressable
          onPress={() => router.push("/(app)/preference-filter")}
          accessibilityRole="button"
          accessibilityLabel="Discovery filters"
          style={{
            position: "absolute",
            top: theme.spacing.md,
            right: theme.spacing.md,
            zIndex: 30,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.color.surfaceSecondary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="options-outline" size={20} color={theme.color.textPrimary} />
        </Pressable>

        <View style={{ flex: 1, padding: theme.spacing.md, paddingBottom: 112 }}>
          {visible.length === 0 ? (
            <NoMorePeople onExpand={() => router.push("/(app)/discovery-preferences")} onBoost={() => router.push("/(app)/boost")} />
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
                  onViewProfile={() => router.push({ pathname: "/(app)/profile/[userId]", params: { userId: p.id } })}
                />
              );
            })
          )}
        </View>

        {visible.length > 0 ? (
          <View
            style={{
              position: "absolute",
              bottom: theme.spacing.lg,
              left: 0,
              right: 0,
              paddingHorizontal: theme.spacing.lg,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              zIndex: 20,
            }}
          >
            <ActionButton iconName="time-outline" color={theme.swipe.rewind} size={48} onPress={handleRewind} disabled={!lastSwiped} />
            <ActionButton iconName="close" color={theme.swipe.pass} size={64} onPress={() => !busy && topCardRef.current?.swipe("pass")} />
            <ActionButton iconName="star" color={theme.swipe.superlike} size={48} onPress={() => !busy && topCardRef.current?.swipe("superlike")} />
            <ActionButton iconName="heart" color={theme.swipe.like} size={64} filled onPress={() => !busy && topCardRef.current?.swipe("like")} />
            <ActionButton iconName="flash" color={theme.swipe.boost} size={48} onPress={() => router.push("/(app)/boost")} />
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

// White circle + tinted icon for every action except Like, which is the
// export's one solid-fill button (bg-primary-container, white icon) — the
// single action that matters gets the same "filled" treatment Button.tsx
// gives its primary variant.
function ActionButton({
  iconName,
  color,
  size,
  onPress,
  disabled,
  filled,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  onPress: () => void;
  disabled?: boolean;
  filled?: boolean;
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
        backgroundColor: filled ? color : theme.color.surface,
        opacity: disabled ? 0.4 : 1,
        shadowColor: filled ? color : "#000",
        shadowOffset: { width: 0, height: filled ? 8 : 2 },
        shadowOpacity: filled ? 0.3 : 0.12,
        shadowRadius: filled ? 16 : 6,
        elevation: 3,
      }}
    >
      <Ionicons name={iconName} size={size * 0.42} color={filled ? "#FFFFFF" : color} />
    </Pressable>
  );
}

// Matches design/stitch_just_spark_ui_kit/discover_no_more_people/code.html:
// a decorative icon medallion, "You've Seen Everyone!", and two real ways
// forward (widen the discovery filters, or boost to get seen by more
// people) instead of a single generic "Refresh" button.
function NoMorePeople({ onExpand, onBoost }: { onExpand: () => void; onBoost: () => void }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.xl, paddingHorizontal: theme.spacing.md }}>
      <View
        style={{
          width: 128,
          height: 128,
          borderRadius: 64,
          backgroundColor: theme.color.surfaceSecondary,
          alignItems: "center",
          justifyContent: "center",
          ...theme.shadow.floating,
        }}
      >
        <Ionicons name="compass" size={56} color={theme.color.primary} />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={[theme.typography.display, { color: theme.color.textPrimary, textAlign: "center" }]}>
          You've Seen Everyone!
        </Text>
        <Text style={[theme.typography.bodyLg, { color: theme.color.textSecondary, textAlign: "center", maxWidth: 280 }]}>
          You're all caught up in your area. Cast a wider net to find more kind connections.
        </Text>
      </View>

      <View style={{ width: "100%", gap: theme.spacing.sm }}>
        <Button label="Expand Discovery" onPress={onExpand} fullWidth />
        <Button label="Boost My Profile" variant="secondary" onPress={onBoost} fullWidth />
      </View>
    </View>
  );
}
