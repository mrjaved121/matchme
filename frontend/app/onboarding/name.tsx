import { useEffect, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { OnboardingStepLayout } from "../../components/OnboardingStepLayout";
import { TextField } from "../../components/TextField";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { applyPendingReferralCode } from "../../lib/referral";

export default function OnboardingName() {
  const session = useAuthStore((s) => s.session);
  const [firstName, setFirstName] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("first_name, city")
      .eq("id", session!.user.id)
      .single()
      .then(({ data }) => {
        if (data?.first_name) setFirstName(data.first_name);
        if (data?.city) setCity(data.city);
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
      .update({ first_name: firstName.trim(), city: city.trim() || null })
      .eq("id", session!.user.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await applyPendingReferralCode(session!.user.id).catch(() => {});
    router.push("/onboarding/birthdate");
  }

  return (
    <OnboardingStepLayout
      step={1}
      totalSteps={11}
      title="What's your name?"
      subtitle="This is how you'll appear to other people on MatchMe."
      onNext={handleNext}
      nextDisabled={loading}
      nextLoading={loading}
      canGoBack={false}
    >
      <View style={{ gap: 16 }}>
        <TextField
          label="First name"
          placeholder="Alex"
          value={firstName}
          onChangeText={setFirstName}
          error={error}
        />
        <TextField
          label="City (optional)"
          placeholder="San Francisco"
          value={city}
          onChangeText={setCity}
        />
      </View>
    </OnboardingStepLayout>
  );
}
