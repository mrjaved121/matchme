import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme/useTheme";
import { LEGAL_UPDATED, TERMS_SECTIONS } from "../../lib/legalContent";

export default function TermsOfService() {
  const theme = useTheme();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.md, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.xs }}>
          <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>Terms of Service</Text>
          <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>
            Last updated {LEGAL_UPDATED}
          </Text>
        </View>

        {TERMS_SECTIONS.map((section) => (
          <View key={section.heading} style={{ gap: theme.spacing.xs }}>
            <Text style={[theme.typography.subtext, { color: theme.color.textPrimary, fontWeight: "700" }]}>
              {section.heading}
            </Text>
            <Text style={[theme.typography.body, { color: theme.color.textSecondary, lineHeight: 24 }]}>
              {section.body}
            </Text>
          </View>
        ))}

        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </ScreenContainer>
  );
}
