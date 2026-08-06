import { useEffect, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import Slider from "@react-native-community/slider";
import { ScreenContainer } from "../../components/ScreenContainer";
import { TextField } from "../../components/TextField";
import { ChipSelect } from "../../components/ChipSelect";
import { Button } from "../../components/Button";
import { ErrorState, LoadingState } from "../../components/StateViews";
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
  filter_verified_only: boolean;
  filter_online_only: boolean;
  filter_recently_active_only: boolean;
  filter_new_members_only: boolean;
};

export default function DiscoveryPreferences() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const isGold = useAuthStore((s) => s.profile?.is_gold ?? false);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  function loadPrefs() {
    setLoadError(false);
    supabase
      .from("profiles")
      .select(
        "interested_in, min_age_pref, max_age_pref, max_distance_km, global_mode, filter_verified_only, filter_online_only, filter_recently_active_only, filter_new_members_only",
      )
      .eq("id", myId)
      .single()
      .then(({ data, error: fetchError }) => {
        if (fetchError || !data) {
          setLoadError(true);
          return;
        }
        setPrefs({
          interested_in: data.interested_in ?? [],
          min_age_pref: data.min_age_pref,
          max_age_pref: data.max_age_pref,
          max_distance_km: data.max_distance_km ?? 50,
          global_mode: data.global_mode ?? false,
          filter_verified_only: data.filter_verified_only ?? false,
          filter_online_only: data.filter_online_only ?? false,
          filter_recently_active_only: data.filter_recently_active_only ?? false,
          filter_new_members_only: data.filter_new_members_only ?? false,
        });
      });
  }

  useEffect(() => {
    loadPrefs();
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

  function goldGate(onAllowed: () => void) {
    if (!isGold) {
      router.push("/(app)/gold");
      return;
    }
    onAllowed();
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
        filter_verified_only: prefs.filter_verified_only,
        filter_online_only: prefs.filter_online_only,
        filter_recently_active_only: prefs.filter_recently_active_only,
        filter_new_members_only: prefs.filter_new_members_only,
      })
      .eq("id", myId);
    setSaving(false);
    router.back();
  }

  if (loadError) {
    return (
      <ScreenContainer>
        <ErrorState onRetry={loadPrefs} />
      </ScreenContainer>
    );
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

        <GoldToggleRow
          icon="🌐"
          label="Global Mode"
          description="Match worldwide"
          value={prefs.global_mode}
          isGold={isGold}
          onChange={(v) => goldGate(() => setPrefs((prev) => (prev ? { ...prev, global_mode: v } : prev)))}
        />

        <Pressable
          onPress={() => goldGate(() => router.push("/(app)/passport"))}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.card,
            padding: theme.spacing.md,
          }}
        >
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 16 }}>✈️</Text>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[theme.typography.body, { color: theme.color.textPrimary }]}>Passport</Text>
                {!isGold ? <Text style={{ color: theme.color.gold, fontSize: 11, fontWeight: "800" }}>GOLD</Text> : null}
              </View>
              <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>Set your discovery location to any city</Text>
            </View>
          </View>
          <Text style={{ color: theme.color.textSecondary, fontSize: 18 }}>›</Text>
        </Pressable>

        <View style={{ gap: theme.spacing.sm }}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.color.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
            ]}
          >
            Advanced Filters
          </Text>
          <GoldToggleRow
            icon="✓"
            label="Verified Users"
            description="Only show verified profiles"
            value={prefs.filter_verified_only}
            isGold={isGold}
            onChange={(v) => goldGate(() => setPrefs((prev) => (prev ? { ...prev, filter_verified_only: v } : prev)))}
          />
          <GoldToggleRow
            icon="●"
            label="Online Users"
            description="Only show people online right now"
            value={prefs.filter_online_only}
            isGold={isGold}
            onChange={(v) => goldGate(() => setPrefs((prev) => (prev ? { ...prev, filter_online_only: v } : prev)))}
          />
          <GoldToggleRow
            icon="🕒"
            label="Recently Active"
            description="Only show people active in the last 24h"
            value={prefs.filter_recently_active_only}
            isGold={isGold}
            onChange={(v) =>
              goldGate(() => setPrefs((prev) => (prev ? { ...prev, filter_recently_active_only: v } : prev)))
            }
          />
          <GoldToggleRow
            icon="✨"
            label="New Members"
            description="Only show profiles created in the last 7 days"
            value={prefs.filter_new_members_only}
            isGold={isGold}
            onChange={(v) =>
              goldGate(() => setPrefs((prev) => (prev ? { ...prev, filter_new_members_only: v } : prev)))
            }
          />
        </View>
      </View>

      <Button label="Apply Filters" onPress={handleSave} loading={saving} style={{ marginTop: theme.spacing.xl }} />
    </ScreenContainer>
  );
}

function GoldToggleRow({
  icon,
  label,
  description,
  value,
  isGold,
  onChange,
}: {
  icon: string;
  label: string;
  description: string;
  value: boolean;
  isGold: boolean;
  onChange: (value: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => (!isGold ? onChange(true) : undefined)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.card,
        padding: theme.spacing.md,
      }}
    >
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[theme.typography.body, { color: theme.color.textPrimary }]}>{label}</Text>
            {!isGold ? (
              <Text style={{ color: theme.color.gold, fontSize: 11, fontWeight: "800" }}>GOLD</Text>
            ) : null}
          </View>
          <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>{description}</Text>
        </View>
      </View>
      <Switch
        value={isGold && value}
        onValueChange={onChange}
        disabled={!isGold}
        trackColor={{ true: theme.color.primary }}
      />
    </Pressable>
  );
}
