import { useEffect, useState } from "react";
import { router } from "expo-router";
import { OnboardingStepLayout } from "../../components/OnboardingStepLayout";
import { TextField } from "../../components/TextField";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { applyPendingReferralCode } from "../../lib/referral";
import { SAVE_ERROR_MESSAGE } from "../../lib/errorMessages";

// Matches design/stitch_just_spark_ui_kit/onboarding_name/code.html exactly:
// a single name field. City moved to its own step (onboarding_location has
// a dedicated GPS-detect + manual-search screen) rather than being asked
// twice.
export default function OnboardingName() {
  const session = useAuthStore((s) => s.session);
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("first_name")
      .eq("id", session!.user.id)
      .single()
      .then(({ data }) => {
        if (data?.first_name) setFirstName(data.first_name);
      });
  }, [session]);

  async function handleNext() {
    if (firstName.trim().length < 2) {
      setError("Enter your first name.");
      return;
    }
    setError(undefined);
    setLoading(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ first_name: firstName.trim() })
      .eq("id", session!.user.id);

    setLoading(false);

    if (updateError) {
      setError(SAVE_ERROR_MESSAGE);
      return;
    }

    await applyPendingReferralCode(session!.user.id).catch(() => {});
    router.push("/onboarding/birthdate");
  }

  return (
    <OnboardingStepLayout
      step={1}
      totalSteps={12}
      title="What's your name?"
      subtitle="This is how it will appear on your profile."
      onNext={handleNext}
      nextDisabled={loading || firstName.trim().length < 2}
      nextLoading={loading}
      canGoBack={false}
    >
      <TextField label="First name" placeholder="Alex" value={firstName} onChangeText={setFirstName} error={error} />
    </OnboardingStepLayout>
  );
}
