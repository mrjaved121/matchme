import { forwardRef, useImperativeHandle, useRef } from "react";
import { Animated, Dimensions, Image, StyleSheet, Text, View } from "react-native";
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
  city: string | null;
  job_title: string | null;
  interest_tags: string[];
  is_verified: boolean;
  photoUrl: string | null;
};

type Props = {
  profile: SwipeCardProfile;
  isTop: boolean;
  onSwiped: (action: SwipeAction) => void;
};

export const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard(
  { profile, isTop, onSwiped },
  ref,
) {
  const theme = useTheme();
  const position = useRef(new Animated.ValueXY()).current;
  const startPosition = useRef({ x: 0, y: 0 }).current;

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
    .onBegin(() => {
      startPosition.x = 0;
      startPosition.y = 0;
    })
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

  const content = (
    <Animated.View style={[styles.card, { backgroundColor: theme.color.surface }, cardStyle]}>
      {profile.photoUrl ? (
        <Image source={{ uri: profile.photoUrl }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, { alignItems: "center", justifyContent: "center", backgroundColor: theme.color.border }]}>
          <Text style={{ fontSize: 64, color: theme.color.textSecondary }}>
            {profile.first_name?.[0]?.toUpperCase() ?? "?"}
          </Text>
        </View>
      )}

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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.name}>
            {profile.first_name ?? "MatchMe user"}{profile.age ? `, ${profile.age}` : ""}
          </Text>
          {profile.is_verified ? <Text style={{ fontSize: 18 }}>✓</Text> : null}
        </View>
        {profile.job_title || profile.city ? (
          <Text style={styles.subline}>
            {[profile.job_title, profile.city].filter(Boolean).join(" · ")}
          </Text>
        ) : null}
        {profile.bio ? (
          <Text style={styles.bio} numberOfLines={2}>
            {profile.bio}
          </Text>
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

  return <GestureDetector gesture={pan}>{content}</GestureDetector>;
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
