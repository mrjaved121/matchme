import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingStepLayout } from "../../components/OnboardingStepLayout";
import { ChipSelect } from "../../components/ChipSelect";
import { TextField } from "../../components/TextField";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { LOOKING_FOR_OPTIONS } from "../../lib/constants";

const GENDER_PREF_OPTIONS: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Women", value: "female", icon: "woman-outline" },
  { label: "Men", value: "male", icon: "man-outline" },
  { label: "Everyone", value: "everyone", icon: "people-outline" },
];

// The card selector matches design/stitch_just_spark_ui_kit/onboarding_looking_for/
// code.html exactly (icon-circle + label + checkmark rows, "Everyone"
// exclusive with the others). Age range and relationship type aren't in
// that export at all, but they're core matching criteria — not optional
// extras like height/education — so they stay here, grouped with the
// preference they belong to, rather than moved to the unrelated
// "about you" screen.
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
        if (data?.interested_in?.length) {
          const isEveryone = data.interested_in.includes("male") && data.interested_in.includes("female");
          setInterestedIn(isEveryone ? ["everyone"] : data.interested_in);
        }
        if (data?.min_age_pref) setMinAge(String(data.min_age_pref));
        if (data?.max_age_pref) setMaxAge(String(data.max_age_pref));
        if (data?.looking_for) setLookingFor(data.looking_for);
      });
  }, [session]);

  function selectGenderPref(value: string) {
    if (value === "everyone") {
      setInterestedIn(["everyone"]);
      return;
    }
    setInterestedIn((prev) => {
      const withoutEveryone = prev.filter((v) => v !== "everyone");
      return withoutEveryone.includes(value) ? withoutEveryone.filter((v) => v !== value) : [...withoutEveryone, value];
    });
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
        interested_in: interestedIn.includes("everyone") ? ["male", "female", "nonbinary"] : interestedIn,
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

    router.push("/onboarding/location");
  }

  return (
    <OnboardingStepLayout
      step={4}
      totalSteps={12}
      title="Who do you want to meet?"
      subtitle="You can change this later."
      onNext={handleNext}
      nextDisabled={loading || interestedIn.length === 0}
      nextLoading={loading}
    >
      <View style={{ gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.sm }}>
          {GENDER_PREF_OPTIONS.map((option) => {
            const selected = interestedIn.includes(option.value);
            return (
              <Pressable
                key={option.value}
                onPress={() => selectGenderPref(option.value)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: theme.spacing.md,
                  borderRadius: 24,
                  backgroundColor: selected ? theme.color.surfaceSecondary : theme.color.inputFill,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: selected ? theme.color.primary : theme.color.surfaceVariant,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name={option.icon} size={24} color={selected ? "#FFFFFF" : theme.color.textPrimary} />
                  </View>
                  <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>{option.label}</Text>
                </View>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: selected ? theme.color.primary : theme.color.surfaceVariant,
                  }}
                >
                  {selected ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ gap: theme.spacing.xs }}>
          <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>Age range</Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.sm, alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <TextField placeholder="Min" keyboardType="number-pad" maxLength={2} value={minAge} onChangeText={setMinAge} />
            </View>
            <Text style={{ color: theme.color.textSecondary }}>to</Text>
            <View style={{ flex: 1 }}>
              <TextField placeholder="Max" keyboardType="number-pad" maxLength={2} value={maxAge} onChangeText={setMaxAge} />
            </View>
          </View>
        </View>

        <View style={{ gap: theme.spacing.xs }}>
          <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>Looking for</Text>
          <ChipSelect options={LOOKING_FOR_OPTIONS} selected={lookingFor ? [lookingFor] : []} onToggle={setLookingFor} />
        </View>

        {error ? <Text style={[theme.typography.caption, { color: theme.color.error }]}>{error}</Text> : null}
      </View>
    </OnboardingStepLayout>
  );
}
