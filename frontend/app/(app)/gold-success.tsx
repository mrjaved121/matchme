import { Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme/useTheme";

const ACTIVE_BENEFITS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "eye", label: "See Who Likes You" },
  { icon: "arrow-undo", label: "Unlimited Rewinds" },
  { icon: "heart", label: "Unlimited Likes" },
];

// Matches design/stitch_just_spark_ui_kit/upgrade_success/code.html: a
// premium badge medallion, "You're a Spark Plus Member!", an Active
// Benefits card, and a "Start Swiping" CTA. The export's falling-confetti
// animation is skipped — it's a lot of animation machinery for a one-time
// screen — in favor of a static sparkle badge that reads the same
// celebratory note without it.
export default function GoldSuccess() {
  const theme = useTheme();

  return (
    <ScreenContainer>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.xl }}>
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <LinearGradient
            colors={theme.color.primaryGradient}
            style={{
              width: 128,
              height: 128,
              borderRadius: 64,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: theme.color.surface,
              ...theme.shadow.floating,
            }}
          >
            <Ionicons name="ribbon" size={64} color="#FFFFFF" />
          </LinearGradient>
          <View
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: theme.color.surface,
              alignItems: "center",
              justifyContent: "center",
              ...theme.shadow.card,
            }}
          >
            <Ionicons name="sparkles" size={16} color={theme.color.primary} />
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={[theme.typography.display, { color: theme.color.textPrimary, textAlign: "center" }]}>
            You're a Spark Plus Member!
          </Text>
          <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center", maxWidth: 280 }]}>
            Your premium features are now active. Go find your perfect match.
          </Text>
        </View>

        <View style={{ width: "100%", backgroundColor: theme.color.inputFill, borderRadius: 24, padding: theme.spacing.lg, gap: theme.spacing.md }}>
          <Text style={[theme.typography.label, { color: theme.color.textSecondary, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.5 }]}>
            Your Active Benefits
          </Text>
          {ACTIVE_BENEFITS.map((b) => (
            <View key={b.label} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.color.surface, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={b.icon} size={18} color={theme.color.primary} />
              </View>
              <Text style={[theme.typography.body, { color: theme.color.textPrimary, fontWeight: "600" }]}>{b.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingBottom: theme.spacing.xl }}>
        <Button label="Start Swiping" onPress={() => router.replace("/(app)/discover")} fullWidth />
      </View>
    </ScreenContainer>
  );
}
