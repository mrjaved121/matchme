import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Circle } from "react-native-svg";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme/useTheme";

const RING_SIZE = 192;
const RING_RADIUS = 86;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// Matches design/stitch_just_spark_ui_kit/boost_active/code.html's
// countdown ring, "You're Boosting!" headline, and "Boost Active" pill. The
// export's live-stats panel (view count, matches, a bar chart) is driven
// entirely by a setInterval that fabricates random numbers client-side —
// there's no real view-tracking backend behind it, so it's left out rather
// than show made-up analytics as if they were real.
export default function BoostActive() {
  const theme = useTheme();
  const { until, minutes: minutesParam } = useLocalSearchParams<{ until: string; minutes: string }>();
  const untilMs = until ? new Date(until).getTime() : Date.now();
  const totalMs = (Number(minutesParam) || 30) * 60 * 1000;
  const [remainingMs, setRemainingMs] = useState(untilMs - Date.now());

  useEffect(() => {
    const interval = setInterval(() => setRemainingMs(untilMs - Date.now()), 1000);
    return () => clearInterval(interval);
  }, [untilMs]);

  const progress = Math.min(1, Math.max(0, remainingMs / totalMs));
  const ringOffset = RING_CIRCUMFERENCE * (1 - progress);
  const expired = remainingMs <= 0;

  return (
    <ScreenContainer>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.xl }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: theme.color.surface,
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: theme.radius.pill,
            ...theme.shadow.card,
          }}
        >
          <Ionicons name="flame" size={15} color={theme.color.primary} />
          <Text style={[theme.typography.label, { color: theme.color.textPrimary }]}>
            {expired ? "Boost Ended" : "Boost Active"}
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={[theme.typography.display, { color: theme.color.textPrimary, textAlign: "center" }]}>
            {expired ? "Your Boost Has Ended" : "You're Boosting!"}
          </Text>
          <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center", maxWidth: 280 }]}>
            {expired
              ? "Check Discover to see who you matched with while boosted."
              : "Your profile is currently at the top of the stack. Keep swiping to see your new admirers!"}
          </Text>
        </View>

        <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: "center", justifyContent: "center" }}>
          <View style={{ position: "absolute", width: RING_SIZE, height: RING_SIZE, transform: [{ rotate: "-90deg" }] }}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke={theme.color.surfaceVariant} strokeWidth={6} fill="none" />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={theme.color.primary}
                strokeWidth={6}
                fill="none"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <View
            style={{
              width: RING_SIZE - 24,
              height: RING_SIZE - 24,
              borderRadius: (RING_SIZE - 24) / 2,
              backgroundColor: theme.color.surface,
              alignItems: "center",
              justifyContent: "center",
              ...theme.shadow.floating,
            }}
          >
            <Ionicons name="flash" size={28} color={theme.color.primary} />
            <Text style={[theme.typography.display, { color: theme.color.primary, marginTop: 4 }]}>{formatCountdown(remainingMs)}</Text>
            <Text style={[theme.typography.caption, { color: theme.color.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }]}>
              Remaining
            </Text>
          </View>
        </View>
      </View>

      <View style={{ paddingBottom: theme.spacing.xl }}>
        <Button label="Back to Discover" onPress={() => router.replace("/(app)/discover")} fullWidth />
      </View>
    </ScreenContainer>
  );
}
