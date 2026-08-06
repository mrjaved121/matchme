import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import Ionicons from "@expo/vector-icons/Ionicons";
import { OnboardingStepLayout } from "../../components/OnboardingStepLayout";
import { TextField } from "../../components/TextField";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

// Matches design/stitch_just_spark_ui_kit/onboarding_location/code.html: a
// "Detect Automatically" card (GPS + reverse-geocode to a city name) above
// a manual city text field. The export's live autocomplete-suggestions
// dropdown is dropped — it needs a places API this app doesn't have, and a
// fake/static suggestion list would be worse than no suggestions at all.
export default function OnboardingLocation() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const [city, setCity] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("city")
      .eq("id", session!.user.id)
      .single()
      .then(({ data }) => {
        if (data?.city) setCity(data.city);
      });
  }, [session]);

  async function detectAutomatically() {
    setError(undefined);
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied — enter your city manually instead.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      const [place] = await Location.reverseGeocodeAsync(position.coords);
      const detected = place?.city ?? place?.subregion ?? place?.region;
      if (detected) setCity(detected);
      else setError("Couldn't determine your city — enter it manually.");
    } catch {
      setError("Couldn't detect your location — enter your city manually.");
    } finally {
      setDetecting(false);
    }
  }

  async function handleNext() {
    if (!city.trim()) {
      setError("Enter your city.");
      return;
    }
    setError(undefined);
    setLoading(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        city: city.trim(),
        ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
      })
      .eq("id", session!.user.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/onboarding/about-you");
  }

  return (
    <OnboardingStepLayout
      step={5}
      totalSteps={12}
      title="Where are you located?"
      subtitle="We use your location to show people nearby. You can always adjust your search distance later."
      onNext={handleNext}
      nextDisabled={loading || !city.trim()}
      nextLoading={loading}
    >
      <View style={{ gap: theme.spacing.md }}>
        <Pressable
          onPress={detectAutomatically}
          style={{
            alignItems: "center",
            gap: theme.spacing.sm,
            backgroundColor: theme.color.surfaceSecondary,
            borderRadius: 24,
            padding: theme.spacing.lg,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: theme.color.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="locate" size={28} color={theme.color.primary} />
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={[theme.typography.label, { color: theme.color.textPrimary }]}>Current Location</Text>
            <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>
              {detecting ? "Detecting…" : "Detect Automatically"}
            </Text>
          </View>
          <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>
            Most accurate for nearby matches
          </Text>
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
          <View style={{ flex: 1, height: 1, backgroundColor: theme.color.border }} />
          <Text style={[theme.typography.caption, { color: theme.color.textSecondary, textTransform: "uppercase" }]}>
            or enter manually
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: theme.color.border }} />
        </View>

        <TextField
          leadingIcon="search-outline"
          placeholder="e.g. San Francisco, CA"
          value={city}
          onChangeText={(v) => {
            setCity(v);
            setCoords(null);
          }}
          error={error}
        />
      </View>
    </OnboardingStepLayout>
  );
}
