import { useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, Text, View, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "../components/Button";
import { useTheme } from "../theme/useTheme";

const SEEN_KEY = "spark_intro_seen_v1";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Slide = {
  icon: string;
  headline: string;
  subtext: string;
  gradient: readonly [string, string];
};

async function finishIntro() {
  await AsyncStorage.setItem(SEEN_KEY, "true").catch(() => {});
  router.replace("/welcome");
}

export default function Intro() {
  const theme = useTheme();
  const [checking, setChecking] = useState(true);
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  useEffect(() => {
    AsyncStorage.getItem(SEEN_KEY).then((seen) => {
      if (seen === "true") {
        router.replace("/welcome");
      } else {
        setChecking(false);
      }
    });
  }, []);

  const slides: Slide[] = [
    {
      icon: "◈",
      headline: "Two Ways to Connect",
      subtext: "Swipe to discover people nearby, or jump straight into a live, timed speed date — your choice.",
      gradient: theme.color.primaryGradient,
    },
    {
      icon: "★",
      headline: "Send a Super Like",
      subtext: "Really into someone? Let them know you're interested before anyone else does.",
      gradient: [theme.swipe.superlike, "#60A5FA"],
    },
    {
      icon: "🌐",
      headline: "Go Global",
      subtext: "Moving soon, or just curious? Gold members can match in any city with Passport.",
      gradient: [theme.swipe.like, "#34D399"],
    },
    {
      icon: "💬",
      headline: "Chat When You Match",
      subtext: "Mutual likes unlock a real conversation — no ghosting a profile that never replies.",
      gradient: theme.color.goldGradient,
    },
  ];

  if (checking) {
    return <View style={{ flex: 1, backgroundColor: theme.color.background }} />;
  }

  const isLast = index === slides.length - 1;

  function handleContinue() {
    if (isLast) {
      finishIntro();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }

  function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setIndex(newIndex);
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item }) => (
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{
              width: SCREEN_WIDTH,
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: theme.spacing.xl,
              gap: theme.spacing.md,
            }}
          >
            <Text style={{ fontSize: 64 }}>{item.icon}</Text>
            <Text style={{ fontSize: 28, fontWeight: "800", color: "#FFFFFF", textAlign: "center" }}>
              {item.headline}
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.9)", textAlign: "center", lineHeight: 22 }}>
              {item.subtext}
            </Text>
          </LinearGradient>
        )}
      />

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
          gap: theme.spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === index ? "#FFFFFF" : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </View>
        <Button label={isLast ? "Get Started" : "Continue"} variant="secondary" onPress={handleContinue} />
        {!isLast ? (
          <Button label="Skip" variant="ghost" textColor="rgba(255,255,255,0.85)" onPress={finishIntro} />
        ) : null}
      </View>
    </View>
  );
}
