import { useEffect, useState } from "react";
import { Switch, Text, View } from "react-native";
import { router } from "expo-router";
import Slider from "@react-native-community/slider";
import { ScreenContainer } from "../../components/ScreenContainer";
import { TextField } from "../../components/TextField";
import { ChipSelect } from "../../components/ChipSelect";
import { Button } from "../../components/Button";
import { LoadingState } from "../../components/StateViews";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { GENDER_OPTIONS } from "../../lib/constants";

type Prefs = {
  interested_in: string[];
  min_age_pref: number;
  max_age_pref: number;
  max_distance_km: number;
  global_mode: boolean;
};

export default function DiscoveryPreferences() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("interested_in, min_age_pref, max_age_pref, max_distance_km, global_mode")
      .eq("id", myId)
      .single()
      .then(({ data }) => {
        if (data) {
          setPrefs({
            interested_in: data.interested_in ?? [],
            min_age_pref: data.min_age_pref,
            max_age_pref: data.max_age_pref,
            max_distance_km: data.max_distance_km ?? 50,
            global_mode: data.global_mode ?? false,
          });
        }
      });
  }, [myId]);

  function toggleGender(value: string) {
    setPrefs((prev) =>
      prev
        ? {
            ...prev,
            interested_in: prev.interested_in.includes(value)
              ? prev.interested_in.filter((v) => v !== value)
              : [...prev.interested_in, value],
          }
        : prev,
    );
  }

  async function handleSave() {
    if (!prefs) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        interested_in: prefs.interested_in,
        min_age_pref: prefs.min_age_pref,
        max_age_pref: prefs.max_age_pref,
        max_distance_km: Math.round(prefs.max_distance_km),
        global_mode: prefs.global_mode,
      })
      .eq("id", myId);
    setSaving(false);
    router.back();
  }

  if (!prefs) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={[theme.typography.title, { color: theme.color.textPrimary, marginTop: theme.spacing.md, marginBottom: theme.spacing.lg }]}>
        Discovery Preferences
      </Text>

      <View style={{ gap: theme.spacing.lg }}>
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>Maximum Distance</Text>
            <Text style={[theme.typography.subtext, { color: theme.color.primary, fontWeight: "700" }]}>
              {prefs.global_mode ? "Anywhere" : `${Math.round(prefs.max_distance_km)} km`}
            </Text>
          </View>
          <Slider
            style={{ marginTop: theme.spacing.sm }}
            minimumValue={1}
            maximumValue={200}
            step={1}
            value={prefs.max_distance_km}
            disabled={prefs.global_mode}
            onValueChange={(v) => setPrefs((prev) => (prev ? { ...prev, max_distance_km: v } : prev))}
            minimumTrackTintColor={theme.color.primary}
            maximumTrackTintColor={theme.color.border}
            thumbTintColor={theme.color.primary}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>Age range</Text>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Min"
                keyboardType="number-pad"
                value={String(prefs.min_age_pref)}
                onChangeText={(v) => setPrefs((prev) => (prev ? { ...prev, min_age_pref: parseInt(v, 10) || 18 } : prev))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="Max"
                keyboardType="number-pad"
                value={String(prefs.max_age_pref)}
                onChangeText={(v) => setPrefs((prev) => (prev ? { ...prev, max_age_pref: parseInt(v, 10) || 99 } : prev))}
              />
            </View>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>Show Me</Text>
          <ChipSelect options={GENDER_OPTIONS} selected={prefs.interested_in} onToggle={toggleGender} />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.card,
            padding: theme.spacing.md,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={[theme.typography.body, { color: theme.color.textPrimary }]}>🌐 Global Mode</Text>
            <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>Match worldwide</Text>
          </View>
          <Switch
            value={prefs.global_mode}
            onValueChange={(v) => setPrefs((prev) => (prev ? { ...prev, global_mode: v } : prev))}
            trackColor={{ true: theme.color.primary }}
          />
        </View>
      </View>

      <Button label="Apply Filters" onPress={handleSave} loading={saving} style={{ marginTop: theme.spacing.xl }} />
    </ScreenContainer>
  );
}
