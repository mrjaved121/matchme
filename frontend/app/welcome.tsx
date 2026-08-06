import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Dimensions, Image, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "../components/ScreenContainer";
import { useTheme } from "../theme/useTheme";
import { storePendingReferralCode } from "../lib/referral";

const SEEN_KEY = "spark_intro_seen_v1";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Photo by Ayo Ogunseinde on Unsplash (Unsplash License — free for
// commercial use), standing in for the export's own stock photo, which was
// a Stitch preview asset with no cleared usage rights.
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1569925444984-9e2e5fc3d1fb?fm=jpg&q=80&w=1200&auto=format&fit=crop";

const SLIDES = [
  { headline: "Meet people nearby", subtext: "Discover genuine connections just around the corner." },
  { headline: "Real, verified profiles", subtext: "Feel secure knowing who you're talking to." },
  { headline: "Chat and connect", subtext: "Start meaningful conversations with ease." },
];

function notConfigured(provider: string) {
  Alert.alert(
    `${provider} sign-in isn't set up yet`,
    `${provider} requires developer credentials that haven't been configured for this app yet. Use email to continue for now.`,
  );
}

// Matches design/stitch_just_spark_ui_kit/welcome/code.html: photo hero (55%
// height, rounded bottom corners) + auto-rotating 3-slide value-prop
// carousel + dots + 3 CTA buttons + a login link — replacing the old
// separate intro-carousel screen entirely, since the export has no such
// screen. The hero uses a brand-gradient placeholder instead of the export's
// literal photo, which is a Stitch preview asset with no usage rights
// cleared for a real app — swap in a licensed photo whenever you have one.
// "Use phone number" is relabeled to email: the app never built real phone
// auth (an earlier, deliberate call to skip that cost), so it opens the
// working email flow instead of a dead end.
export default function Welcome() {
  const theme = useTheme();
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  const [index, setIndex] = useState(0);
  const trackX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (ref) storePendingReferralCode(ref).catch(() => {});
    AsyncStorage.setItem(SEEN_KEY, "true").catch(() => {});
  }, [ref]);

  const slideWidth = SCREEN_WIDTH - theme.spacing.screen * 2;

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % SLIDES.length;
        Animated.timing(trackX, { toValue: -next * slideWidth, duration: 400, useNativeDriver: true }).start();
        return next;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [trackX, slideWidth]);

  function goEmail(mode: "signup" | "login") {
    router.push({ pathname: "/sign-in", params: { mode } });
  }

  return (
    <ScreenContainer padded={false}>
      <View style={{ flex: 1 }}>
        <View style={{ width: "100%", height: "42%", borderBottomLeftRadius: 48, borderBottomRightRadius: 48, overflow: "hidden" }}>
          <Image source={{ uri: HERO_PHOTO }} style={{ width: "100%", height: "100%" }} />
          <LinearGradient
            colors={["transparent", theme.color.background]}
            style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "50%" }}
          />
        </View>

        <View style={{ flex: 1, justifyContent: "space-between", paddingHorizontal: theme.spacing.screen, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.xl }}>
          <View>
            <View style={{ width: SCREEN_WIDTH - theme.spacing.screen * 2, overflow: "hidden" }}>
              <Animated.View style={{ flexDirection: "row", transform: [{ translateX: trackX }] }}>
                {SLIDES.map((item) => (
                  <View key={item.headline} style={{ width: SCREEN_WIDTH - theme.spacing.screen * 2, alignItems: "center" }}>
                    <Text style={[theme.typography.display, { color: theme.color.textPrimary, textAlign: "center" }]}>
                      {item.headline}
                    </Text>
                    <Text
                      style={[
                        theme.typography.body,
                        { color: theme.color.textSecondary, textAlign: "center", marginTop: theme.spacing.xs },
                      ]}
                    >
                      {item.subtext}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: theme.spacing.md }}>
              {SLIDES.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === index ? 16 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: i === index ? theme.color.primary : theme.color.border,
                  }}
                />
              ))}
            </View>
          </View>

          <View style={{ gap: theme.spacing.sm }}>
            <WelcomeButton
              icon="logo-google"
              label="Continue with Google"
              backgroundColor={theme.color.surfaceVariant}
              textColor={theme.color.textPrimary}
              onPress={() => notConfigured("Google")}
            />
            <WelcomeButton
              icon="logo-apple"
              label="Continue with Apple"
              backgroundColor={theme.color.textPrimary}
              textColor="#FFFFFF"
              onPress={() => notConfigured("Apple")}
            />
            <WelcomeButton
              icon="mail-outline"
              label="Continue with email"
              backgroundColor="transparent"
              textColor={theme.color.primary}
              borderColor={theme.color.primary}
              onPress={() => goEmail("signup")}
            />
            <View style={{ flexDirection: "row", justifyContent: "center", paddingTop: theme.spacing.xs }}>
              <Text style={[theme.typography.body, { color: theme.color.textSecondary }]}>
                Already have an account?{" "}
              </Text>
              <Pressable onPress={() => goEmail("login")}>
                <Text style={[theme.typography.label, { color: theme.color.primary }]}>Log in</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

function WelcomeButton({
  icon,
  label,
  backgroundColor,
  textColor,
  borderColor,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.sm,
        minHeight: 56,
        borderRadius: theme.radius.pill,
        backgroundColor,
        borderWidth: borderColor ? 2 : 0,
        borderColor,
      }}
    >
      <Ionicons name={icon} size={20} color={textColor} />
      <Text style={[theme.typography.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}
