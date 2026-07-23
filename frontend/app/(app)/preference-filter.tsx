import { useEffect, useState } from "react";
import { ScrollView, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "../../components/ScreenContainer";
import { ChipSelect } from "../../components/ChipSelect";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { LoadingState } from "../../components/StateViews";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { GENDER_OPTIONS } from "../../lib/constants";

type Filters = {
  interestedIn: string[];
  minAge: string;
  maxAge: string;
  city: string | null;
  preferSameCity: boolean;
};

export default function PreferenceFilter() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);

  const [filters, setFilters] = useState<Filters | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("interested_in, min_age_pref, max_age_pref, city, prefer_same_city")
      .eq("id", myId)
      .single()
      .then(({ data }) => {
        if (data) {
          setFilters({
            interestedIn: data.interested_in ?? [],
            minAge: String(data.min_age_pref),
            maxAge: String(data.max_age_pref),
            city: data.city,
            preferSameCity: data.prefer_same_city,
          });
        }
      });
  }, [myId]);

  function toggleGender(value: string) {
    setFilters((prev) =>
      prev
        ? {
            ...prev,
            interestedIn: prev.interestedIn.includes(value)
              ? prev.interestedIn.filter((v) => v !== value)
              : [...prev.interestedIn, value],
          }
        : prev,
    );
  }

  async function handleFindMatches() {
    if (!filters) return;

    const min = parseInt(filters.minAge, 10);
    const max = parseInt(filters.maxAge, 10);

    if (filters.interestedIn.length === 0) {
      setError("Select at least one option.");
      return;
    }
    if (!(min >= 18 && max >= min)) {
      setError("Enter a valid age range (18+).");
      return;
    }
    if (filters.preferSameCity && !filters.city?.trim()) {
      setError("Add a city to match same-city only, or turn that off.");
      return;
    }

    setError(undefined);
    setLoading(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        interested_in: filters.interestedIn,
        min_age_pref: min,
        max_age_pref: max,
        prefer_same_city: filters.preferSameCity,
      })
      .eq("id", myId);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.replace("/(app)/queue");
  }

  if (!filters) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ gap: theme.spacing.lg, paddingVertical: theme.spacing.md }}>
        <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>
          Filter your match
        </Text>

        <View style={{ gap: theme.spacing.sm }}>
          <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>
            Who do you want to meet?
          </Text>
          <ChipSelect options={GENDER_OPTIONS} selected={filters.interestedIn} onToggle={toggleGender} />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>
            Age range
          </Text>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <TextField
                placeholder="Min"
                keyboardType="number-pad"
                maxLength={2}
                value={filters.minAge}
                onChangeText={(v) => setFilters({ ...filters, minAge: v })}
              />
            </View>
            <Text style={{ color: theme.color.textSecondary }}>to</Text>
            <View style={{ flex: 1 }}>
              <TextField
                placeholder="Max"
                keyboardType="number-pad"
                maxLength={2}
                value={filters.maxAge}
                onChangeText={(v) => setFilters({ ...filters, maxAge: v })}
              />
            </View>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: theme.spacing.md,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[theme.typography.body, { color: theme.color.textPrimary }]}>
              Same city only
            </Text>
            <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>
              {filters.city
                ? `Only match with people in ${filters.city}`
                : "Add a city in your profile to enable this"}
            </Text>
          </View>
          <Switch
            value={filters.preferSameCity}
            onValueChange={(v) => setFilters({ ...filters, preferSameCity: v })}
            trackColor={{ true: theme.color.primary }}
          />
        </View>

        {error ? (
          <Text style={[theme.typography.caption, { color: theme.color.error }]}>{error}</Text>
        ) : null}

        <Button label="Find matches" onPress={handleFindMatches} loading={loading} disabled={loading} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </ScreenContainer>
  );
}
