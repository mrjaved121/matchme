import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { OnboardingStepLayout } from "../../components/OnboardingStepLayout";
import { ChipSelect } from "../../components/ChipSelect";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

const GENDER_OPTIONS = [
  { label: "Woman", value: "female" },
  { label: "Man", value: "male" },
  { label: "Non-binary", value: "nonbinary" },
  { label: "Other", value: "other" },
];

export default function OnboardingGender() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const [gender, setGender] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleNext() {
    if (!gender) {
      setError("Select the option that best describes you.");
      return;
    }
    setError(undefined);
    setLoading(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ gender })
      .eq("id", session!.user.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/onboarding/preferences");
  }

  return (
    <OnboardingStepLayout
      step={3}
      totalSteps={7}
      title="I am a..."
      onNext={handleNext}
      nextDisabled={loading}
      nextLoading={loading}
    >
      <View style={{ gap: 12 }}>
        <ChipSelect
          options={GENDER_OPTIONS}
          selected={gender ? [gender] : []}
          onToggle={(value) => setGender(value)}
        />
        {error ? (
          <Text style={[theme.typography.caption, { color: theme.color.error }]}>{error}</Text>
        ) : null}
      </View>
    </OnboardingStepLayout>
  );
}
