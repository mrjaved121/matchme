import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Animated, Dimensions, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../theme/useTheme";
import type { SwipeAction } from "../lib/discover";
import { interestIcon } from "../lib/interestIcon";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const OFFSCREEN_DISTANCE = SCREEN_WIDTH * 1.4;

export type SwipeCardHandle = {
  swipe: (action: SwipeAction) => void;
};

export type SwipeCardProfile = {
  id: string;
  first_name: string | null;
  bio: string;
  age: number | null;
  distanceLabel: string | null;
  job_title: string | null;
  loveLanguage: string | null;
  interest_tags: string[];
  is_verified: boolean;
  isOnline: boolean;
  matchScore: number;
  photoUrls: string[];
};

type Props = {
  profile: SwipeCardProfile;
  isTop: boolean;
  onSwiped: (action: SwipeAction) => void;
  onViewProfile?: () => void;
};

export const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard(
  { profile, isTop, onSwiped, onViewProfile },
  ref,
) {
  const theme = useTheme();
  const position = useRef(new Animated.ValueXY()).current;
  const [photoIndex, setPhotoIndex] = useState(0);

  function flingOut(action: SwipeAction) {
    const target =
      action === "pass"
        ? { x: -OFFSCREEN_DISTANCE, y: 40 }
        : action === "superlike"
          ? { x: 0, y: -OFFSCREEN_DISTANCE }
          : { x: OFFSCREEN_DISTANCE, y: 40 };

    Animated.timing(position, {
      toValue: target,
      duration: 240,
      useNativeDriver: true,
    }).start(() => onSwiped(action));
  }

  useImperativeHandle(ref, () => ({
    swipe: (action) => flingOut(action),
  }));

  const pan = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      position.setValue({ x: e.translationX, y: e.translationY });
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        flingOut("like");
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        flingOut("pass");
      } else if (e.translationY < -SWIPE_THRESHOLD) {
        flingOut("superlike");
      } else {
        Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 6 }).start();
      }
    });

  const tap = Gesture.Tap()
    .enabled(isTop && profile.photoUrls.length > 1)
    .onEnd((e) => {
      setPhotoIndex((prev) => {
        const goingBack = e.x < SCREEN_WIDTH / 2;
        const next = goingBack ? prev - 1 : prev + 1;
        return Math.max(0, Math.min(profile.photoUrls.length - 1, next));
      });
    });

  const composed = Gesture.Race(pan, tap);

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-12deg", "0deg", "12deg"],
  });
  const likeOpacity = position.x.interpolate({ inputRange: [20, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: "clamp" });
  const passOpacity = position.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, -20], outputRange: [1, 0], extrapolate: "clamp" });
  const superlikeOpacity = position.y.interpolate({ inputRange: [-SWIPE_THRESHOLD, -20], outputRange: [1, 0], extrapolate: "clamp" });

  // Absolutely-positioned siblings need their own numeric insets — a
  // parent's `padding` has no effect on an absolutely-positioned child in
  // React Native/Yoga, so the margin and the bottom clearance for the
  // Discover action-button row both live here instead.
  const cardPosition = {
    position: "absolute" as const,
    left: theme.spacing.md,
    right: theme.spacing.md,
    top: isTop ? theme.spacing.md : theme.spacing.md + 10,
    bottom: 130,
  };

  const cardStyle = isTop
    ? {
        transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }],
      }
    : { transform: [{ scale: 0.96 }] };

  const currentPhoto = profile.photoUrls[photoIndex];

  // Split into a shadow-casting outer box and a rounded-and-clipped inner
  // box: `overflow: "hidden"` (needed to clip the photo to the rounded
  // corners) also clips the shadow on Android if it's on the same View as
  // `elevation`, which is why the card was rendering flat instead of
  // floating like the design.
  const content = (
    <Animated.View
      style={[
        styles.cardShadow,
        { borderRadius: 24, backgroundColor: theme.color.surface, ...theme.shadow.floating },
        cardPosition,
        cardStyle,
      ]}
    >
    <View style={[styles.card, { backgroundColor: theme.color.surface }]}>
      {currentPhoto ? (
        <Image source={{ uri: currentPhoto }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, { alignItems: "center", justifyContent: "center", backgroundColor: theme.color.border }]}>
          <Text style={{ fontSize: 64, color: theme.color.textSecondary }}>
            {profile.first_name?.[0]?.toUpperCase() ?? "?"}
          </Text>
        </View>
      )}

      {profile.photoUrls.length > 1 ? (
        <View style={styles.photoProgressRow}>
          {profile.photoUrls.map((_, i) => (
            <View
              key={i}
              style={[
                styles.photoProgressSegment,
                { backgroundColor: i === photoIndex ? "#FFFFFF" : "rgba(255,255,255,0.35)" },
              ]}
            />
          ))}
        </View>
      ) : null}

      {isTop ? (
        <>
          <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
            <Text style={[styles.stampText, { color: theme.swipe.like, borderColor: theme.swipe.like }]}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.passStamp, { opacity: passOpacity }]}>
            <Text style={[styles.stampText, { color: theme.swipe.pass, borderColor: theme.swipe.pass }]}>NOPE</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.superlikeStamp, { opacity: superlikeOpacity }]}>
            <Text style={[styles.stampText, { color: theme.swipe.superlike, borderColor: theme.swipe.superlike }]}>SUPER LIKE</Text>
          </Animated.View>
        </>
      ) : null}

      <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} style={styles.gradientOverlay} pointerEvents="none" />

      <View style={styles.infoOverlay}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.name}>
            {profile.first_name ?? "Spark user"}{profile.age ? `, ${profile.age}` : ""}
          </Text>
          {profile.is_verified ? (
            <Ionicons name="checkmark-circle" size={22} color={theme.swipe.superlike} />
          ) : null}
        </View>
        {profile.job_title || profile.distanceLabel ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 2 }}>
            {profile.job_title ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="briefcase-outline" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.subline}>{profile.job_title}</Text>
              </View>
            ) : null}
            {profile.distanceLabel ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.subline}>{profile.distanceLabel}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 12 }}>
          <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6, maxHeight: 38, overflow: "hidden" }}>
            {profile.interest_tags.slice(0, 3).map((tag) => {
              const icon = interestIcon(tag);
              return (
                <View key={tag} style={styles.cardTag}>
                  {icon ? <Ionicons name={icon} size={14} color="#FFFFFF" /> : null}
                  <Text style={styles.cardTagText}>{tag.charAt(0).toUpperCase() + tag.slice(1)}</Text>
                </View>
              );
            })}
          </View>
          {onViewProfile ? (
            <Pressable onPress={onViewProfile} style={styles.infoButton}>
              <Ionicons name="information-outline" size={18} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
    </Animated.View>
  );

  if (!isTop) {
    return content;
  }

  return <GestureDetector gesture={composed}>{content}</GestureDetector>;
});

const styles = StyleSheet.create({
  cardShadow: {},
  card: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoProgressRow: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    gap: 4,
  },
  photoProgressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "60%",
  },
  infoOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    paddingTop: 60,
  },
  name: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cardTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  cardTagText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    marginLeft: 8,
  },
  subline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  stamp: {
    position: "absolute",
    top: 48,
    zIndex: 10,
  },
  likeStamp: { left: 24, transform: [{ rotate: "-18deg" }] },
  passStamp: { right: 24, transform: [{ rotate: "18deg" }] },
  superlikeStamp: { alignSelf: "center", top: 24 },
  stampText: {
    fontSize: 30,
    fontWeight: "800",
    borderWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    letterSpacing: 1,
  },
});
