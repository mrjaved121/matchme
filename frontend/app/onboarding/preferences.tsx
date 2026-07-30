import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { OnboardingStepLayout } from "../../components/OnboardingStepLayout";
import { ChipSelect } from "../../components/ChipSelect";
import { TextField } from "../../components/TextField";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { GENDER_OPTIONS, LOOKING_FOR_OPTIONS } from "../../lib/constants";

export default function OnboardingPreferences() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const [interestedIn, setInterestedIn] = useState<string[]>([]);
  const [minAge, setMinAge] = useState("18");
  const [maxAge, setMaxAge] = useState("45");
  const [lookingFor, setLookingFor] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("interested_in, min_age_pref, max_age_pref, looking_for")
      .eq("id", session!.user.id)
      .single()
      .then(({ data }) => {
        if (data?.interested_in?.length) setInterestedIn(data.interested_in);
        if (data?.min_age_pref) setMinAge(String(data.min_age_pref));
        if (data?.max_age_pref) setMaxAge(String(data.max_age_pref));
        if (data?.looking_for) setLookingFor(data.looking_for);
      });
  }, [session]);

  function toggle(value: string) {
    setInterestedIn((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  async function handleNext() {
    const min = parseInt(minAge, 10);
    const max = parseInt(maxAge, 10);

    if (interestedIn.length === 0) {
      setError("Select at least one option.");
      return;
    }
    if (!(min >= 18 && max >= min)) {
      setError("Enter a valid age range (18+).");
      return;
    }
    if (!lookingFor) {
      setError("Let us know what you're looking for.");
      return;
    }

    setError(undefined);
    setLoading(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        interested_in: interestedIn,
        min_age_pref: min,
        max_age_pref: max,
        looking_for: lookingFor,
      })
      .eq("id", session!.user.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/onboarding/photos");
  }

  return (
    <OnboardingStepLayout
      step={4}
      totalSteps={7}
      title="Who do you want to meet?"
      onNext={handleNext}
      nextDisabled={loading}
      nextLoading={loading}
    >
      <View style={{ gap: 20 }}>
        <ChipSelect options={GENDER_OPTIONS} selected={interestedIn} onToggle={toggle} />

        <View style={{ gap: 8 }}>
          <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>
            Age range
          </Text>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <TextField
                placeholder="Min"
                keyboardType="number-pad"
                maxLength={2}
                value={minAge}
                onChangeText={setMinAge}
              />
            </View>
            <Text style={{ color: theme.color.textSecondary }}>to</Text>
            <View style={{ flex: 1 }}>
              <TextField
                placeholder="Max"
                keyboardType="number-pad"
                maxLength={2}
                value={maxAge}
                onChangeText={setMaxAge}
              />
            </View>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>
            Looking for
          </Text>
          <ChipSelect
            options={LOOKING_FOR_OPTIONS}
            selected={lookingFor ? [lookingFor] : []}
            onToggle={setLookingFor}
          />
        </View>

        {error ? (
          <Text style={[theme.typography.caption, { color: theme.color.error }]}>{error}</Text>
        ) : null}
      </View>
    </OnboardingStepLayout>
  );
}
