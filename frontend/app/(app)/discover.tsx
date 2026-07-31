import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "../../components/ScreenContainer";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { SwipeCard, type SwipeCardHandle, type SwipeCardProfile } from "../../components/SwipeCard";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { publicPhotoUrl } from "../../lib/photoUrl";
import { calculateAge, captureAndSaveLocation, fetchDiscoverCandidates, recordSwipe, type SwipeAction } from "../../lib/discover";

export default function Discover() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);

  const [deck, setDeck] = useState<SwipeCardProfile[] | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const topCardRef = useRef<SwipeCardHandle>(null);

  const load = useCallback(async () => {
    setError(false);
    setDeck(null);
    try {
      const candidates = await fetchDiscoverCandidates(15);
      const ids = candidates.map((c) => c.id);
      const { data: photos } =
        ids.length > 0
          ? await supabase.from("profile_photos").select("profile_id, storage_path").in("profile_id", ids).eq("position", 0)
          : { data: [] };
      const photoById = new Map((photos ?? []).map((p) => [p.profile_id, p.storage_path]));

      setDeck(
        candidates.map((c) => ({
          id: c.id,
          first_name: c.first_name,
          bio: c.bio,
          age: c.birthdate ? calculateAge(c.birthdate) : null,
          city: c.city,
          job_title: c.job_title,
          interest_tags: c.interest_tags ?? [],
          is_verified: c.is_verified,
          photoUrl: photoById.has(c.id) ? publicPhotoUrl(photoById.get(c.id)!) : null,
        })),
      );
    } catch {
      setError(true);
    }
  }, []);

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
    } catch {
      // Non-fatal — the card already left the deck; nothing useful to retry mid-swipe.
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <ScreenContainer>
        <ErrorState onRetry={load} />
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
        <View style={{ flex: 1 }}>
          {visible.length === 0 ? (
            <EmptyState
              title="You're all caught up"
              description="No new people right now — check back soon, or widen your discovery preferences."
              actionLabel="Refresh"
              onAction={load}
            />
          ) : (
            [...visible].reverse().map((profile, i) => {
              const isTop = i === visible.length - 1;
              return (
                <SwipeCard
                  key={profile.id}
                  ref={isTop ? topCardRef : undefined}
                  profile={profile}
                  isTop={isTop}
                  onSwiped={(action) => handleSwiped(profile.id, action)}
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
