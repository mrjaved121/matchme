import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { ChipSelect } from "../../../components/ChipSelect";
import { TextField } from "../../../components/TextField";
import { Button } from "../../../components/Button";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";

const REASONS = [
  { label: "Inappropriate behavior", value: "inappropriate_behavior" },
  { label: "Fake profile", value: "fake_profile" },
  { label: "Harassment", value: "harassment" },
  { label: "Nudity", value: "nudity" },
  { label: "Spam", value: "spam" },
  { label: "Other", value: "other" },
];

export default function ReportUser() {
  const theme = useTheme();
  const { targetUserId } = useLocalSearchParams<{ targetUserId: string }>();
  const myId = useAuthStore((s) => s.session!.user.id);

  const [reason, setReason] = useState<string | undefined>();
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!reason) {
      Alert.alert("Select a reason for this report.");
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from("reports").insert({
      reporter_id: myId,
      reported_id: targetUserId,
      reason,
      details: details.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      Alert.alert("Couldn't submit report", error.message);
      return;
    }

    Alert.alert("Report submitted", "Our team will review this.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  async function handleBlock() {
    setSubmitting(true);
    const { error } = await supabase.from("blocks").insert({ blocker_id: myId, blocked_id: targetUserId });
    setSubmitting(false);

    if (error) {
      Alert.alert("Couldn't block user", error.message);
      return;
    }

    Alert.alert("User blocked", undefined, [{ text: "OK", onPress: () => router.replace("/(app)/matches") }]);
  }

  return (
    <ScreenContainer>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>Report user</Text>

        <ChipSelect options={REASONS} selected={reason ? [reason] : []} onToggle={setReason} />

        <TextField
          label="Additional details (optional)"
          value={details}
          onChangeText={setDetails}
          multiline
          numberOfLines={4}
          style={{ minHeight: 90, textAlignVertical: "top", paddingVertical: 12 }}
        />

        <Button label="Submit report" onPress={handleSubmit} loading={submitting} />
        <Button label="Block this user" variant="danger" onPress={handleBlock} loading={submitting} />
      </View>
    </ScreenContainer>
  );
}
