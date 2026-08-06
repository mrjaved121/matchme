import { useEffect, useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { OnboardingStepLayout } from "../../components/OnboardingStepLayout";
import { ChipSelect } from "../../components/ChipSelect";
import { useTheme } from "../../theme/useTheme";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
import { SAVE_ERROR_MESSAGE } from "../../lib/errorMessages";
import { INTEREST_OPTIONS } from "../../lib/constants";

const MIN_INTERESTS = 3;

export default function OnboardingInterests() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("interest_tags")
      .eq("id", session!.user.id)
      .single()
      .then(({ data }) => {
        if (data?.interest_tags?.length) setInterests(data.interest_tags);
      });
  }, [session]);

  function toggle(value: string) {
    setInterests((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  async function handleNext() {
    if (interests.length < MIN_INTERESTS) {
      setError(`Pick at least ${MIN_INTERESTS} interests.`);
      return;
    }
    setError(undefined);
    setLoading(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ interest_tags: interests })
      .eq("id", session!.user.id);

    setLoading(false);

    if (updateError) {
      setError(SAVE_ERROR_MESSAGE);
      return;
    }

    router.push("/onboarding/photos");
  }

  return (
    <OnboardingStepLayout
      step={9}
      totalSteps={12}
      title="What are you into?"
      subtitle={`Pick at least ${MIN_INTERESTS} to help us find better matches.`}
      onNext={handleNext}
      nextDisabled={loading}
      nextLoading={loading}
    >
      <ChipSelect options={INTEREST_OPTIONS} selected={interests} onToggle={toggle} />
      {error ? (
        <Text style={[theme.typography.caption, { color: theme.color.error, marginTop: 12 }]}>{error}</Text>
      ) : null}
    </OnboardingStepLayout>
  );
}
