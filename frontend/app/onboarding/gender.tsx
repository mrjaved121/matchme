import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { OnboardingStepLayout } from "../../components/OnboardingStepLayout";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { SAVE_ERROR_MESSAGE } from "../../lib/errorMessages";
import { useAuthStore } from "../../store/authStore";

const CORE_OPTIONS = [
  { label: "Woman", value: "female" },
  { label: "Man", value: "male" },
  { label: "Nonbinary", value: "nonbinary" },
];
const MORE_OPTIONS = [{ label: "Other", value: "other" }];

// Matches design/stitch_just_spark_ui_kit/onboarding_gender/code.html: tall
// selectable rows (not small wrapped chips), 3 core options plus a "More
// gender options" link that reveals the rest. No orientation field exists
// anywhere in this Stitch kit — dropped rather than kept as an unplaced
// addition; the app still has the column for whenever a real spot is
// designed for it.
export default function OnboardingGender() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const [gender, setGender] = useState<string | undefined>();
  const [showMore, setShowMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("gender")
      .eq("id", session!.user.id)
      .single()
      .then(({ data }) => {
        if (data?.gender) {
          setGender(data.gender);
          if (MORE_OPTIONS.some((o) => o.value === data.gender)) setShowMore(true);
        }
      });
  }, [session]);

  async function handleNext() {
    if (!gender) {
      setError("Select the option that best describes you.");
      return;
    }
    setError(undefined);
    setLoading(true);

    const { error: updateError } = await supabase.from("profiles").update({ gender }).eq("id", session!.user.id);

    setLoading(false);

    if (updateError) {
      setError(SAVE_ERROR_MESSAGE);
      return;
    }

    router.push("/onboarding/preferences");
  }

  const options = showMore ? [...CORE_OPTIONS, ...MORE_OPTIONS] : CORE_OPTIONS;

  return (
    <OnboardingStepLayout
      step={3}
      totalSteps={12}
      title="I am a..."
      subtitle="Choose how you identify."
      onNext={handleNext}
      nextDisabled={loading || !gender}
      nextLoading={loading}
    >
      <View style={{ gap: theme.spacing.sm }}>
        {options.map((option) => {
          const selected = gender === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setGender(option.value)}
              style={{
                paddingVertical: theme.spacing.md,
                borderRadius: 24,
                alignItems: "center",
                backgroundColor: selected ? theme.color.surfaceSecondary : theme.color.inputFill,
                borderWidth: selected ? 2 : 0,
                borderColor: theme.color.primary,
              }}
            >
              <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>{option.label}</Text>
            </Pressable>
          );
        })}
        {!showMore ? (
          <Pressable onPress={() => setShowMore(true)} style={{ alignSelf: "center", paddingVertical: theme.spacing.sm }}>
            <Text style={[theme.typography.label, { color: theme.color.primary }]}>More gender options</Text>
          </Pressable>
        ) : null}
        {error ? <Text style={[theme.typography.caption, { color: theme.color.error }]}>{error}</Text> : null}
      </View>
    </OnboardingStepLayout>
  );
}
