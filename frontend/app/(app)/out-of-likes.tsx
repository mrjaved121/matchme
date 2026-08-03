import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme/useTheme";

function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return midnight.getTime() - now.getTime();
}

function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function OutOfLikes() {
  const theme = useTheme();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const isSuperlike = type === "superlike";
  const [remaining, setRemaining] = useState(msUntilMidnight());

  useEffect(() => {
    const timer = setInterval(() => setRemaining(msUntilMidnight()), 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: theme.spacing.md }}>
        <Text style={{ fontSize: 56 }}>{isSuperlike ? "⭐" : "♥"}</Text>
        <Text style={[theme.typography.display, { color: theme.color.textPrimary, textAlign: "center" }]}>
          {isSuperlike ? "Out of Super Likes" : "Out of Likes for Today"}
        </Text>
        <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center" }]}>
          {isSuperlike
            ? "You've used today's free Super Like. Gold gets you 5 a day."
            : "You've used all your free likes today. Gold gets you unlimited likes."}
        </Text>
        <Text style={[theme.typography.caption, { color: theme.color.textSecondary, marginTop: theme.spacing.sm }]}>
          Resets in {formatCountdown(remaining)}
        </Text>
      </View>

      <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xl }}>
        <Button label="👑 Upgrade to Gold" onPress={() => router.replace("/(app)/gold")} gradientColors={theme.color.goldGradient} textColor="#1A1200" />
        <Button label="Maybe later" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScreenContainer>
  );
}
