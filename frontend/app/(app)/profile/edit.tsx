import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { TextField } from "../../../components/TextField";
import { ChipSelect } from "../../../components/ChipSelect";
import { Button } from "../../../components/Button";
import { LoadingState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";

const INTEREST_OPTIONS = [
  "Travel", "Music", "Fitness", "Foodie", "Movies", "Reading",
  "Gaming", "Outdoors", "Art", "Dancing", "Coffee", "Pets",
].map((label) => ({ label, value: label.toLowerCase() }));

type EditableProfile = {
  first_name: string;
  city: string | null;
  bio: string;
  interest_tags: string[];
  min_age_pref: number;
  max_age_pref: number;
};

export default function EditProfile() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [form, setForm] = useState<EditableProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("first_name, city, bio, interest_tags, min_age_pref, max_age_pref")
      .eq("id", myId)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            first_name: data.first_name ?? "",
            city: data.city,
            bio: data.bio ?? "",
            interest_tags: data.interest_tags ?? [],
            min_age_pref: data.min_age_pref,
            max_age_pref: data.max_age_pref,
          });
        }
      });
  }, [myId]);

  function toggleInterest(value: string) {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            interest_tags: prev.interest_tags.includes(value)
              ? prev.interest_tags.filter((v) => v !== value)
              : [...prev.interest_tags, value],
          }
        : prev,
    );
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError(undefined);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        first_name: form.first_name.trim(),
        city: form.city?.trim() || null,
        bio: form.bio.trim(),
        interest_tags: form.interest_tags,
        min_age_pref: form.min_age_pref,
        max_age_pref: form.max_age_pref,
      })
      .eq("id", myId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await refreshProfile();
    router.back();
  }

  if (!form) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ gap: theme.spacing.md, paddingVertical: theme.spacing.md }}>
        <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>Edit profile</Text>

        <TextField
          label="First name"
          value={form.first_name}
          onChangeText={(v) => setForm({ ...form, first_name: v })}
        />
        <TextField
          label="City"
          value={form.city ?? ""}
          onChangeText={(v) => setForm({ ...form, city: v })}
        />
        <TextField
          label="Bio"
          value={form.bio}
          onChangeText={(v) => setForm({ ...form, bio: v })}
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: "top", paddingVertical: 12 }}
        />

        <View style={{ gap: theme.spacing.sm }}>
          <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>
            Interests
          </Text>
          <ChipSelect
            options={INTEREST_OPTIONS}
            selected={form.interest_tags}
            onToggle={toggleInterest}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <TextField
              label="Min age"
              keyboardType="number-pad"
              value={String(form.min_age_pref)}
              onChangeText={(v) => setForm({ ...form, min_age_pref: parseInt(v, 10) || 18 })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextField
              label="Max age"
              keyboardType="number-pad"
              value={String(form.max_age_pref)}
              onChangeText={(v) => setForm({ ...form, max_age_pref: parseInt(v, 10) || 99 })}
            />
          </View>
        </View>

        {error ? (
          <Text style={[theme.typography.caption, { color: theme.color.error }]}>{error}</Text>
        ) : null}

        <Button label="Save changes" onPress={handleSave} loading={saving} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </ScreenContainer>
  );
}
