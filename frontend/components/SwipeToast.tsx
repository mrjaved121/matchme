import { useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useTheme } from "../theme/useTheme";

const VISIBLE_MS = 700;

export function useSwipeToast() {
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  function show(text: string) {
    setMessage(text);
    opacity.stopAnimation();
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.delay(VISIBLE_MS),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setMessage(null);
    });
  }

  return { message, opacity, show };
}

// A brief, non-blocking confirmation for actions (like/pass/superlike/
// rewind) that don't already navigate somewhere on their own -- so every
// tap feels acknowledged even when nothing else changes on screen.
export function SwipeToast({ message, opacity }: { message: string | null; opacity: Animated.Value }) {
  const theme = useTheme();
  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: theme.spacing.xl,
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 40,
        opacity,
      }}
    >
      <View
        style={{
          backgroundColor: "rgba(0,0,0,0.75)",
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: theme.radius.pill,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 14 }}>{message}</Text>
      </View>
    </Animated.View>
  );
}
