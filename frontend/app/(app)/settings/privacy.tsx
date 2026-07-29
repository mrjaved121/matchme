import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";

export default function PrivacySettings() {
  const theme = useTheme();
  const myId = useAuthStore((s) => s.session!.user.id);
  const [pausing, setPausing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function togglePause() {
    setPausing(true);
    const { data } = await supabase.from("profiles").select("status").eq("id", myId).single();
    const nextStatus = data?.status === "paused" ? "active" : "paused";
    await supabase.from("profiles").update({ status: nextStatus }).eq("id", myId);
    setPausing(false);
    Alert.alert(nextStatus === "paused" ? "Account paused" : "Account reactivated");
  }

  function confirmDelete() {
    Alert.alert(
      "Delete account",
      "This permanently deletes your profile, matches, and messages. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: handleDelete },
      ],
    );
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await supabase.functions.invoke("delete-account");
    setDeleting(false);
    if (error) {
      Alert.alert("Couldn't delete account", error.message);
      return;
    }
    await supabase.auth.signOut();
  }

  return (
    <ScreenContainer>
      <Text
        style={[theme.typography.title, { color: theme.color.textPrimary, marginTop: theme.spacing.md, marginBottom: theme.spacing.md }]}
      >
        Privacy & account
      </Text>

      <View style={{ gap: theme.spacing.md }}>
        <View style={{ gap: theme.spacing.xs }}>
          <Text style={[theme.typography.body, { color: theme.color.textPrimary }]}>
            Pause your account
          </Text>
          <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>
            Hides you from new matchmaking while paused. You can reactivate any time.
          </Text>
          <Button label="Pause / resume account" variant="secondary" onPress={togglePause} loading={pausing} />
        </View>

        <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.lg }}>
          <Text style={[theme.typography.body, { color: theme.color.error }]}>Delete account</Text>
          <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>
            Permanently deletes your profile, matches, and messages.
          </Text>
          <Button label="Delete my account" variant="danger" onPress={confirmDelete} loading={deleting} />
        </View>

        <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.lg }}>
          <Button label="Privacy Policy" variant="ghost" onPress={() => router.push("/legal/privacy")} />
          <Button label="Terms of Service" variant="ghost" onPress={() => router.push("/legal/terms")} />
        </View>
      </View>
    </ScreenContainer>
  );
}
