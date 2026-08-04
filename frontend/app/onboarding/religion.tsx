import { useEffect, useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { OnboardingStepLayout } from "../../components/OnboardingStepLayout";
import { ChipSelect } from "../../components/ChipSelect";
import { useTheme } from "../../theme/useTheme";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { RELIGION_OPTIONS } from "../../lib/constants";

export default function OnboardingReligion() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const [religion, setReligion] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("religion")
      .eq("id", session!.user.id)
      .single()
      .then(({ data }) => {
        if (data?.religion) setReligion(data.religion);
      });
  }, [session]);

  async function handleNext() {
    setError(undefined);
    setLoading(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ religion: religion ?? null, onboarding_extras_completed: true })
      .eq("id", session!.user.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/onboarding/interests");
  }

  return (
    <OnboardingStepLayout
      step={8}
      totalSteps={12}
      title="Religion"
      subtitle="Optional — only shown on your profile if you want it to be."
      onNext={handleNext}
      nextDisabled={loading}
      nextLoading={loading}
    >
      <ChipSelect
        options={RELIGION_OPTIONS}
        selected={religion ? [religion] : []}
        onToggle={(value) => setReligion((prev) => (prev === value ? undefined : value))}
      />
      {error ? (
        <Text style={[theme.typography.caption, { color: theme.color.error, marginTop: 12 }]}>{error}</Text>
      ) : null}
    </OnboardingStepLayout>
  );
}
