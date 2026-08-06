import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { useTheme } from "../../../theme/useTheme";

const TOOLKIT = [
  {
    icon: "document-text-outline" as const,
    title: "Reporting Guidelines",
    body: "Learn what to report and how our team handles your concerns confidentially.",
    message:
      "Report anything that violates our community guidelines: harassment, hate speech, scams, fake photos, or unsafe behavior. Reports are reviewed by our team and kept confidential — the person you report is never told who reported them.",
  },
  {
    icon: "bulb-outline" as const,
    title: "Safety Tips",
    body: "Best practices for matching, messaging, and meeting up in person.",
    message:
      "Keep chats on Spark until you're comfortable. Video chat before meeting up. Choose a public place for first dates and tell a friend where you'll be. Trust your instincts — you never owe anyone your time.",
  },
];

const RESOURCES = [
  {
    icon: "walk-outline" as const,
    title: "Staying Safe Offline",
    body: "Tips for your first in-person date.",
    message:
      "Meet in a public place, arrange your own transportation, and let a friend or family member know your plans. Stay sober enough to make clear decisions, and don't feel pressured to stay if something feels off.",
  },
  {
    icon: "shield-outline" as const,
    title: "How We Protect Your Data",
    body: "Understanding our privacy measures.",
    message:
      "Your exact location is never shared with other users — only an approximate distance. Photos and messages are stored securely, and you can delete your account and data at any time from Privacy & account.",
  },
  {
    icon: "eye-outline" as const,
    title: "Identifying Scams",
    body: "Red flags to watch out for while swiping.",
    message:
      "Be wary of anyone who moves too fast emotionally, asks for money or gift cards, refuses to video chat, or asks you to move the conversation off the app immediately. When in doubt, report and block.",
  },
];

// Matches design/stitch_just_spark_ui_kit/safety_center/code.html's section
// order (Safety Toolkit cards, Emergency Actions, Learning & Resources list).
// The export's card/resource taps would open dedicated articles; there's no
// CMS backing that content here, so each shows its real safety copy inline
// via an alert instead of linking to a page that doesn't exist. Contact
// Emergency Services intentionally doesn't dial a hardcoded number — 911
// only works in some countries — it points people to their local emergency
// number instead of assuming one.
export default function SafetyCenter() {
  const theme = useTheme();

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: theme.spacing.xl }}>
        <View style={{ alignItems: "center", marginTop: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <Text style={[theme.typography.display, { color: theme.color.textPrimary, textAlign: "center" }]}>Safety Center</Text>
          <Text style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center", marginTop: 8 }]}>
            We're committed to making Spark a kind, respectful, and safe space for everyone.
          </Text>
        </View>

        <Text style={[theme.typography.title, { color: theme.color.textPrimary, marginBottom: theme.spacing.sm }]}>Safety Toolkit</Text>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginBottom: theme.spacing.xl }}>
          {TOOLKIT.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => Alert.alert(item.title, item.message)}
              style={{
                flex: 1,
                backgroundColor: theme.color.surface,
                borderRadius: theme.radius.card,
                padding: theme.spacing.md,
                gap: theme.spacing.sm,
                ...theme.shadow.card,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: theme.color.surfaceSecondary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={item.icon} size={20} color={theme.color.primary} />
              </View>
              <Text style={[theme.typography.label, { color: theme.color.textPrimary }]}>{item.title}</Text>
              <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>{item.body}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => router.push("/(app)/settings/privacy")}
            style={{
              flex: 1,
              backgroundColor: theme.color.surface,
              borderRadius: theme.radius.card,
              padding: theme.spacing.md,
              gap: theme.spacing.sm,
              ...theme.shadow.card,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: theme.color.surfaceSecondary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="lock-closed-outline" size={20} color={theme.color.primary} />
            </View>
            <Text style={[theme.typography.label, { color: theme.color.textPrimary }]}>Privacy Settings</Text>
            <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>
              Control who sees your profile and what information you share.
            </Text>
          </Pressable>
        </View>

        <View style={{ backgroundColor: theme.color.errorSoft, borderRadius: theme.radius.card, padding: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
            <Ionicons name="warning" size={26} color={theme.color.error} />
            <Text style={[theme.typography.title, { color: theme.color.error }]}>Emergency Actions</Text>
          </View>
          <Text style={[theme.typography.body, { color: theme.color.textPrimary, marginBottom: theme.spacing.md }]}>
            If you are in immediate danger or need urgent help, please contact local authorities right away.
          </Text>
          <View style={{ gap: theme.spacing.sm }}>
            <Button
              label="Contact Emergency Services"
              variant="danger"
              onPress={() =>
                Alert.alert("Contact Emergency Services", "If you're in immediate danger, call your local emergency number right away.")
              }
            />
            <Button
              label="Report a Concern to Us"
              variant="inverted"
              onPress={() => router.push("/(app)/settings/help")}
            />
          </View>
        </View>

        <Text style={[theme.typography.title, { color: theme.color.textPrimary, marginBottom: theme.spacing.sm }]}>Learning & Resources</Text>
        <View style={{ gap: theme.spacing.sm }}>
          {RESOURCES.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => Alert.alert(item.title, item.message)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.md,
                backgroundColor: theme.color.surface,
                borderRadius: theme.radius.input,
                padding: theme.spacing.md,
                ...theme.shadow.card,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.color.surfaceVariant,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={item.icon} size={18} color={theme.color.verifiedDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[theme.typography.label, { color: theme.color.textPrimary }]}>{item.title}</Text>
                <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>{item.body}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.color.textSecondary} />
            </Pressable>
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
