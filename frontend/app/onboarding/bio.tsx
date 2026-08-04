import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { OnboardingStepLayout } from "../../components/OnboardingStepLayout";
import { TextField } from "../../components/TextField";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

const MAX_LENGTH = 500;
const PROMPTS = ["My perfect Sunday...", "Unpopular opinion...", "I'm a regular at..."];

// Matches design/stitch_just_spark_ui_kit/onboarding_bio/code.html exactly:
// bio textarea with a live character counter, and tappable inspiration
// prompts that get appended to the bio text. The interests picker that used
// to live on this screen was a straight duplicate of onboarding/interests.tsx
// (which already collects interest_tags) — the export's bio screen has no
// interests section at all, so it's removed rather than asked twice.
export default function OnboardingBio() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const [bio, setBio] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("bio")
      .eq("id", session!.user.id)
      .single()
      .then(({ data }) => {
        if (data?.bio) setBio(data.bio);
      });
  }, [session]);

  function applyPrompt(prompt: string) {
    if (bio.includes(prompt)) return;
    setBio((prev) => (prev ? `${prev}\n\n${prompt} ` : `${prompt} `));
    setSelectedPrompt(prompt);
  }

  async function handleNext() {
    if (bio.trim().length < 10) {
      setError("Write a short bio (at least 10 characters).");
      return;
    }
    setError(undefined);
    setLoading(true);

    const { error: updateError } = await supabase.from("profiles").update({ bio: bio.trim() }).eq("id", session!.user.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/onboarding/guidelines");
  }

  return (
    <OnboardingStepLayout
      step={11}
      totalSteps={12}
      title="About you"
      subtitle="Tell others what makes you unique. Be yourself!"
      onNext={handleNext}
      nextDisabled={loading}
      nextLoading={loading}
    >
      <View style={{ gap: theme.spacing.lg }}>
        <View>
          <TextField
            placeholder="I love spontaneous road trips, finding the best local coffee shops, and debating whether pineapple belongs on pizza."
            value={bio}
            onChangeText={(v) => setBio(v.slice(0, MAX_LENGTH))}
            multiline
            numberOfLines={5}
            style={{ minHeight: 120, textAlignVertical: "top", paddingVertical: 12 }}
            error={error}
          />
          <Text
            style={[
              theme.typography.caption,
              { color: bio.length > 450 ? theme.color.primary : theme.color.textSecondary, textAlign: "right", marginTop: 4 },
            ]}
          >
            {bio.length}/{MAX_LENGTH}
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text style={[theme.typography.label, { color: theme.color.textSecondary }]}>Need some inspiration?</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
            {PROMPTS.map((prompt) => {
              const selected = selectedPrompt === prompt;
              return (
                <Pressable
                  key={prompt}
                  onPress={() => applyPrompt(prompt)}
                  style={{
                    paddingVertical: theme.spacing.sm,
                    paddingHorizontal: theme.spacing.md,
                    borderRadius: theme.radius.pill,
                    backgroundColor: selected ? theme.color.primary : theme.color.inputFill,
                  }}
                >
                  <Text style={[theme.typography.body, { color: selected ? "#FFFFFF" : theme.color.textPrimary }]}>{prompt}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </OnboardingStepLayout>
  );
}
