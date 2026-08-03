import { useEffect, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { OnboardingStepLayout } from "../../components/OnboardingStepLayout";
import { TextField } from "../../components/TextField";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";

export default function OnboardingAboutYou() {
  const session = useAuthStore((s) => s.session);
  const [heightCm, setHeightCm] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [education, setEducation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("height_cm, job_title, education")
      .eq("id", session!.user.id)
      .single()
      .then(({ data }) => {
        if (data?.height_cm) setHeightCm(String(data.height_cm));
        if (data?.job_title) setJobTitle(data.job_title);
        if (data?.education) setEducation(data.education);
      });
  }, [session]);

  async function handleNext() {
    const height = parseInt(heightCm, 10);
    setError(undefined);
    setLoading(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        height_cm: Number.isFinite(height) && height > 0 ? height : null,
        job_title: jobTitle.trim() || null,
        education: education.trim() || null,
      })
      .eq("id", session!.user.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/onboarding/languages");
  }

  return (
    <OnboardingStepLayout
      step={5}
      totalSteps={11}
      title="A bit more about you"
      subtitle="All optional — skip anything you'd rather not share."
      onNext={handleNext}
      nextLabel="Continue"
      nextDisabled={loading}
      nextLoading={loading}
    >
      <View style={{ gap: 16 }}>
        <TextField
          label="Height (cm)"
          placeholder="175"
          keyboardType="number-pad"
          value={heightCm}
          onChangeText={setHeightCm}
          error={error}
        />
        <TextField label="Occupation" placeholder="Product designer" value={jobTitle} onChangeText={setJobTitle} />
        <TextField label="Education" placeholder="UC Berkeley" value={education} onChangeText={setEducation} />
      </View>
    </OnboardingStepLayout>
  );
}
