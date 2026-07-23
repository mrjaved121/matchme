import { useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { Button } from "../../../components/Button";
import { ErrorState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";

export default function DateDecision() {
  const theme = useTheme();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [submitted, setSubmitted] = useState(false);
  const [waitingOnOther, setWaitingOnOther] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function submit(decision: "yes" | "no") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setError(undefined);
    setSubmitted(true);

    const { data, error: fnError } = await supabase.functions.invoke("date-decision", {
      body: { session_id: sessionId, decision },
    });

    if (fnError) {
      setSubmitted(false);
      setError(fnError.message);
      return;
    }

    if (data?.status === "waiting_on_other") {
      setWaitingOnOther(true);
      return;
    }

    if (data?.matched && data.match?.id) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace({
        pathname: "/(app)/match-confirmation/[matchId]",
        params: { matchId: data.match.id },
      });
    } else {
      router.replace("/(app)/home");
    }
  }

  if (error) {
    return (
      <ScreenContainer>
        <ErrorState message={error} onRetry={() => setError(undefined)} />
      </ScreenContainer>
    );
  }

  if (waitingOnOther) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.md }}>
          <Text style={[theme.typography.title, { color: theme.color.textPrimary, textAlign: "center" }]}>
            Decision recorded
          </Text>
          <Text
            style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center" }]}
          >
            We'll let you know if it's a match.
          </Text>
          <Button label="Back to home" onPress={() => router.replace("/(app)/home")} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: "center", gap: theme.spacing.xl }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={[theme.typography.display, { color: theme.color.textPrimary, textAlign: "center" }]}>
            How was your date?
          </Text>
          <Text
            style={[theme.typography.body, { color: theme.color.textSecondary, textAlign: "center" }]}
          >
            Your answer is private. If you both say yes, you'll match.
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Button label="Yes, I'd like to match" onPress={() => submit("yes")} loading={submitted} />
          <Button
            label="No thanks"
            variant="secondary"
            onPress={() => submit("no")}
            loading={submitted}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
