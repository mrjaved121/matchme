import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { OnboardingStepLayout } from "../../components/OnboardingStepLayout";
import { TextField } from "../../components/TextField";
import { ChipSelect } from "../../components/ChipSelect";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

const INTEREST_OPTIONS = [
  "Travel", "Music", "Fitness", "Foodie", "Movies", "Reading",
  "Gaming", "Outdoors", "Art", "Dancing", "Coffee", "Pets",
].map((label) => ({ label, value: label.toLowerCase() }));

export default function OnboardingBio() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("bio, interest_tags")
      .eq("id", session!.user.id)
      .single()
      .then(({ data }) => {
        if (data?.bio) setBio(data.bio);
        if (data?.interest_tags?.length) setInterests(data.interest_tags);
      });
  }, [session]);

  function toggleInterest(value: string) {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  async function handleNext() {
    if (bio.trim().length < 10) {
      setError("Write a short bio (at least 10 characters).");
      return;
    }
    setError(undefined);
    setLoading(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ bio: bio.trim(), interest_tags: interests })
      .eq("id", session!.user.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/onboarding/guidelines");
  }

  return (
    <OnboardingStepLayout
      step={10}
      totalSteps={11}
      title="Tell us about you"
      subtitle="Try a prompt: two truths and a lie, or your go-to weekend plan."
      onNext={handleNext}
      nextDisabled={loading}
      nextLoading={loading}
    >
      <View style={{ gap: 20 }}>
        <TextField
          placeholder="I once..."
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: "top", paddingVertical: 12 }}
        />
        <View style={{ gap: 8 }}>
          <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>
            Interests
          </Text>
          <ChipSelect options={INTEREST_OPTIONS} selected={interests} onToggle={toggleInterest} />
        </View>
        {error ? (
          <Text style={[theme.typography.caption, { color: theme.color.error }]}>{error}</Text>
        ) : null}
      </View>
    </OnboardingStepLayout>
  );
}
