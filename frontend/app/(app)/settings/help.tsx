import { Linking, ScrollView, Text, View } from "react-native";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { useTheme } from "../../../theme/useTheme";

const FAQS = [
  { q: "How does matching work?", a: "Swipe through Discover, or jump into a live timed speed date from the Discover header. Mutual likes and speed-date yeses both create a match." },
  { q: "Why can't I see who liked me?", a: "That's a MatchMe Gold feature. Upgrade from your Profile tab to see and match with everyone who's liked you." },
  { q: "How do I report someone?", a: "Open their chat and tap Report, or tap Report from the post-date decision screen. Every report is reviewed by our team." },
  { q: "Can I get my account deleted?", a: "Yes — go to Settings → Privacy & account → Delete my account. This is permanent." },
];

export default function HelpAndSupport() {
  const theme = useTheme();

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: theme.spacing.xl }}>
        <Text style={[theme.typography.title, { color: theme.color.textPrimary, marginTop: theme.spacing.md, marginBottom: theme.spacing.md }]}>
          ❓ Help & Support
        </Text>

        <View style={{ gap: theme.spacing.md }}>
          {FAQS.map((item) => (
            <View key={item.q} style={{ backgroundColor: theme.color.surface, borderRadius: theme.radius.card, padding: theme.spacing.md, gap: 4 }}>
              <Text style={[theme.typography.body, { color: theme.color.textPrimary, fontWeight: "700" }]}>{item.q}</Text>
              <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>{item.a}</Text>
            </View>
          ))}
        </View>

        <Button
          label="Email support"
          variant="secondary"
          onPress={() => Linking.openURL("mailto:support@matchme.app")}
          style={{ marginTop: theme.spacing.lg }}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
