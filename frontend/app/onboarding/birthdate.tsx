import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { OnboardingStepLayout } from "../../components/OnboardingStepLayout";
import { TextField } from "../../components/TextField";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

function calculateAge(year: number, month: number, day: number): number {
  const dob = new Date(year, month - 1, day);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export default function OnboardingBirthdate() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("birthdate")
      .eq("id", session!.user.id)
      .single()
      .then(({ data }) => {
        if (data?.birthdate) {
          const [y, m, d] = data.birthdate.split("-");
          setYear(y);
          setMonth(m);
          setDay(d);
        }
      });
  }, [session]);

  async function handleNext() {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const valid =
      d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= new Date().getFullYear();

    if (!valid) {
      setError("Enter a valid date of birth.");
      return;
    }

    if (calculateAge(y, m, d) < 18) {
      setError("You must be 18 or older to use Spark.");
      return;
    }

    setError(undefined);
    setLoading(true);

    const birthdate = `${y.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}-${d
      .toString()
      .padStart(2, "0")}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ birthdate })
      .eq("id", session!.user.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/onboarding/gender");
  }

  return (
    <OnboardingStepLayout
      step={2}
      totalSteps={12}
      title="When's your birthday?"
      subtitle="You must be 18+ to use Spark. Your age will be public, but not your birthday."
      onNext={handleNext}
      nextDisabled={loading}
      nextLoading={loading}
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <TextField label="Month" placeholder="MM" keyboardType="number-pad" maxLength={2} value={month} onChangeText={setMonth} />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Day" placeholder="DD" keyboardType="number-pad" maxLength={2} value={day} onChangeText={setDay} />
        </View>
        <View style={{ flex: 1.4 }}>
          <TextField label="Year" placeholder="YYYY" keyboardType="number-pad" maxLength={4} value={year} onChangeText={setYear} />
        </View>
      </View>
      {error ? (
        <Text style={[theme.typography.caption, { color: theme.color.error, marginTop: 12 }]}>
          {error}
        </Text>
      ) : null}
    </OnboardingStepLayout>
  );
}
