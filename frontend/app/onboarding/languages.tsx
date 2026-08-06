import { useEffect, useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { OnboardingStepLayout } from "../../components/OnboardingStepLayout";
import { ChipSelect } from "../../components/ChipSelect";
import { useTheme } from "../../theme/useTheme";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { SAVE_ERROR_MESSAGE } from "../../lib/errorMessages";
import { LANGUAGE_OPTIONS } from "../../lib/constants";

export default function OnboardingLanguages() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("languages")
      .eq("id", session!.user.id)
      .single()
      .then(({ data }) => {
        if (data?.languages?.length) setLanguages(data.languages);
      });
  }, [session]);

  function toggle(value: string) {
    setLanguages((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  async function handleNext() {
    setError(undefined);
    setLoading(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ languages })
      .eq("id", session!.user.id);

    setLoading(false);

    if (updateError) {
      setError(SAVE_ERROR_MESSAGE);
      return;
    }

    router.push("/onboarding/religion");
  }

  return (
    <OnboardingStepLayout
      step={7}
      totalSteps={12}
      title="What languages do you speak?"
      subtitle="Optional — helps you match with people you can actually talk to."
      onNext={handleNext}
      nextDisabled={loading}
      nextLoading={loading}
    >
      <ChipSelect options={LANGUAGE_OPTIONS} selected={languages} onToggle={toggle} />
      {error ? (
        <Text style={[theme.typography.caption, { color: theme.color.error, marginTop: 12 }]}>{error}</Text>
      ) : null}
    </OnboardingStepLayout>
  );
}
