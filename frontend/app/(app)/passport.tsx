import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

const POPULAR_DESTINATIONS = [
  { city: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522 },
  { city: "London", country: "United Kingdom", latitude: 51.5072, longitude: -0.1276 },
  { city: "New York", country: "United States", latitude: 40.7128, longitude: -74.006 },
  { city: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503 },
];

// Matches design/stitch_just_spark_ui_kit/passport_location_selection/code.html:
// a search field, a location preview, a "Popular Destinations" list, and a
// "Confirm Location" CTA. The export's live map tile isn't reproducible
// without a maps SDK (none is installed in this app), so it's replaced with
// a themed static pin card that shows the currently-selected destination.
// Confirming writes straight to profiles.latitude/longitude/city — the same
// columns the discover_candidates distance filter already reads — so a
// Passport pick immediately changes who shows up in Discover with no new
// backend schema needed. One disclosed limitation: the next foreground GPS
// capture (app relaunch) silently resets this back to your real location,
// since there's no separate "passport active" flag persisting the override
// beyond the current session.
export default function Passport() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const isGold = useAuthStore((s) => s.profile?.is_gold ?? false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(POPULAR_DESTINATIONS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isGold) router.replace("/(app)/gold");
  }, [isGold]);

  if (!isGold) {
    return null;
  }

  const filtered = POPULAR_DESTINATIONS.filter((d) => d.city.toLowerCase().includes(search.trim().toLowerCase()));

  async function confirm() {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ latitude: selected.latitude, longitude: selected.longitude, city: selected.city })
      .eq("id", myId);
    setSaving(false);
    router.back();
  }

  return (
    <ScreenContainer>
      <Text style={[theme.typography.title, { color: theme.color.textPrimary, marginTop: theme.spacing.md, marginBottom: theme.spacing.md }]}>
        Passport
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: theme.color.inputFill,
          borderRadius: theme.radius.input,
          paddingHorizontal: theme.spacing.md,
          height: 56,
          marginBottom: theme.spacing.lg,
        }}
      >
        <Ionicons name="search" size={18} color={theme.color.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search for a city..."
          placeholderTextColor={theme.color.textSecondary}
          style={[theme.typography.body, { flex: 1, color: theme.color.textPrimary }]}
        />
      </View>

      <LinearGradient
        colors={[theme.color.surfaceSecondary, theme.color.surfaceVariant]}
        style={{ width: "100%", height: 180, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: theme.spacing.lg }}
      >
        <Ionicons name="location" size={36} color={theme.color.primary} />
        <Text style={[theme.typography.title, { color: theme.color.textPrimary, marginTop: 8 }]}>{selected.city}</Text>
        <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>{selected.country}</Text>
      </LinearGradient>

      <Text style={[theme.typography.title, { color: theme.color.textPrimary, marginBottom: theme.spacing.sm }]}>
        Popular Destinations
      </Text>
      <View style={{ gap: theme.spacing.sm }}>
        {filtered.map((d) => {
          const isSelected = d.city === selected.city;
          return (
            <Pressable
              key={d.city}
              onPress={() => setSelected(d)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.md,
                backgroundColor: isSelected ? theme.color.primary + "14" : theme.color.inputFill,
                borderRadius: theme.radius.input,
                padding: theme.spacing.md,
                borderWidth: isSelected ? 1 : 0,
                borderColor: theme.color.primary,
              }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: theme.color.surface, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="airplane" size={20} color={theme.color.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[theme.typography.bodyLg, { color: theme.color.textPrimary, fontWeight: "600" }]}>{d.city}</Text>
                <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>{d.country}</Text>
              </View>
              {isSelected ? <Ionicons name="checkmark-circle" size={20} color={theme.color.primary} /> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: theme.spacing.xl, paddingBottom: theme.spacing.lg }}>
        <Button label={saving ? "Confirming…" : "Confirm Location"} onPress={confirm} loading={saving} fullWidth />
      </View>
    </ScreenContainer>
  );
}
