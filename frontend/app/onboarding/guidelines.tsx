import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { OnboardingStepLayout } from "../../components/OnboardingStepLayout";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

const RULES = [
  "Be respectful. Harassment, hate speech, and nudity result in an immediate ban.",
  "Be real. Use your own recent photos — no fakes or catfishing.",
  "Be present. Speed dates are timed and live — treat your date's time like your own.",
  "Report anything that makes you uncomfortable. We review every report.",
];

export default function OnboardingGuidelines() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleAccept() {
    setError(undefined);
    setLoading(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", session!.user.id);

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    await supabase.rpc("grant_referral_reward", { p_referred_id: session!.user.id });
    await refreshProfile();
    setLoading(false);
    router.replace("/account-created");
  }

  return (
    <OnboardingStepLayout
      step={11}
      totalSteps={11}
      title="Community guidelines"
      onNext={handleAccept}
      nextLabel="Accept & finish"
      nextDisabled={loading}
      nextLoading={loading}
    >
      <ScrollView style={{ flex: 1 }}>
        <View style={{ gap: theme.spacing.md }}>
          {RULES.map((rule) => (
            <Text key={rule} style={[theme.typography.body, { color: theme.color.textPrimary }]}>
              •  {rule}
            </Text>
          ))}
        </View>
      </ScrollView>
      {error ? (
        <Text style={[theme.typography.caption, { color: theme.color.error, marginTop: 12 }]}>
          {error}
        </Text>
      ) : null}
    </OnboardingStepLayout>
  );
}
