import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { useTheme } from "../../../theme/useTheme";

const TIPS = [
  { icon: "📍", title: "Meet in public", body: "For any in-person meetup, choose a public place and tell a friend where you'll be." },
  { icon: "🔍", title: "Video chat first", body: "Use Spark's live speed-date sessions to talk before ever sharing personal contact info." },
  { icon: "🚩", title: "Trust your instincts", body: "If something feels off, end the conversation. You never owe anyone your time." },
  { icon: "🚫", title: "Report and block", body: "Every report is reviewed by our team. Blocking is instant and the other person is never notified." },
];

export default function SafetyCenter() {
  const theme = useTheme();

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: theme.spacing.xl }}>
        <Text style={[theme.typography.title, { color: theme.color.textPrimary, marginTop: theme.spacing.md, marginBottom: theme.spacing.md }]}>
          🛡️ Safety Center
        </Text>

        <View style={{ gap: theme.spacing.md }}>
          {TIPS.map((tip) => (
            <View
              key={tip.title}
              style={{
                backgroundColor: theme.color.surface,
                borderRadius: theme.radius.card,
                padding: theme.spacing.md,
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 20 }}>{tip.icon}</Text>
              <Text style={[theme.typography.body, { color: theme.color.textPrimary, fontWeight: "700" }]}>{tip.title}</Text>
              <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>{tip.body}</Text>
            </View>
          ))}
        </View>

        <Button
          label="Blocked users"
          variant="secondary"
          onPress={() => router.push("/(app)/settings/blocked")}
          style={{ marginTop: theme.spacing.lg }}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
