import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Animated, Dimensions, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTheme } from "../theme/useTheme";
import { Tag } from "./Tag";
import type { SwipeAction } from "../lib/discover";

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

  const cardStyle = isTop
    ? {
        transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }],
      }
    : { transform: [{ scale: 0.96 }], top: 10 };

  const currentPhoto = profile.photoUrls[photoIndex];
  const matchColor =
    profile.matchScore >= 75 ? theme.swipe.like : profile.matchScore >= 45 ? theme.color.gold : theme.color.textSecondary;

  const content = (
    <Animated.View style={[styles.card, { backgroundColor: theme.color.surface }, cardStyle]}>
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

      <View style={[styles.badge, styles.matchBadge, { backgroundColor: matchColor + "CC" }]}>
        <Text style={styles.badgeText}>{profile.matchScore}% match</Text>
      </View>

      {profile.isOnline ? (
        <View style={[styles.badge, styles.onlineBadge, { backgroundColor: theme.swipe.like + "CC" }]}>
          <View style={styles.onlineDot} />
          <Text style={styles.badgeText}>Online</Text>
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

      <View style={styles.infoOverlay}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.name}>
              {profile.first_name ?? "MatchMe user"}{profile.age ? `, ${profile.age}` : ""}
            </Text>
            {profile.is_verified ? <Text style={{ fontSize: 18 }}>✓</Text> : null}
          </View>
          {onViewProfile ? (
            <Pressable
              onPress={onViewProfile}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.2)",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>i</Text>
            </Pressable>
          ) : null}
        </View>
        {profile.job_title || profile.distanceLabel ? (
          <Text style={styles.subline}>
            {[profile.distanceLabel, profile.job_title].filter(Boolean).join(" · ")}
          </Text>
        ) : null}
        {profile.bio ? (
          <Text style={styles.bio} numberOfLines={2}>
            {profile.bio}
          </Text>
        ) : null}
        {profile.loveLanguage ? (
          <View style={styles.promptBox}>
            <Text style={styles.promptLabel}>My love language is...</Text>
            <Text style={styles.promptAnswer} numberOfLines={2}>
              {profile.loveLanguage}
            </Text>
          </View>
        ) : null}
        {profile.interest_tags.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {profile.interest_tags.slice(0, 4).map((tag, index) => (
              <Tag key={tag} label={tag.charAt(0).toUpperCase() + tag.slice(1)} index={index} />
            ))}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );

  if (!isTop) {
    return content;
  }

  return <GestureDetector gesture={composed}>{content}</GestureDetector>;
});

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
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
  badge: {
    position: "absolute",
    top: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  matchBadge: { left: 12 },
  onlineBadge: { right: 12 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFFFFF" },
  badgeText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  infoOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    paddingTop: 60,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  name: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 8,
  },
  promptBox: {
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 12,
    padding: 10,
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
  },
  promptAnswer: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 2,
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
