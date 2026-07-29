import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Button } from "../../components/Button";
import { LoadingState, ErrorState } from "../../components/StateViews";
import { useTheme } from "../../theme/useTheme";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

type Status = "joining" | "waiting" | "matched" | "error";

export default function Queue() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const userId = session!.user.id;
  const [status, setStatus] = useState<Status>("joining");
  const [error, setError] = useState<string | undefined>();
  const [waitedSeconds, setWaitedSeconds] = useState(0);
  const matchedRef = useRef(false);

  useEffect(() => {
    if (status !== "waiting") return;
    setWaitedSeconds(0);
    const interval = setInterval(() => setWaitedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    let cancelled = false;

    async function join() {
      setStatus("joining");
      setError(undefined);

      const { data, error: fnError } = await supabase.functions.invoke("queue-join");

      if (cancelled) return;

      if (fnError) {
        setStatus("error");
        setError(fnError.message);
        return;
      }

      if (data?.status === "matched" && data.session) {
        matchedRef.current = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        router.replace({ pathname: "/(app)/date/[sessionId]", params: { sessionId: data.session.id } });
        return;
      }

      setStatus("waiting");
    }

    join();

    const channel = supabase
      .channel(`queue-match-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "date_sessions", filter: `user_a_id=eq.${userId}` },
        (payload) => {
          matchedRef.current = true;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          router.replace({ pathname: "/(app)/date/[sessionId]", params: { sessionId: payload.new.id } });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "date_sessions", filter: `user_b_id=eq.${userId}` },
        (payload) => {
          matchedRef.current = true;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          router.replace({ pathname: "/(app)/date/[sessionId]", params: { sessionId: payload.new.id } });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      if (!matchedRef.current) {
        supabase.functions.invoke("queue-leave").catch(() => {});
      }
    };
  }, [userId]);

  async function handleCancel() {
    await supabase.functions.invoke("queue-leave");
    router.back();
  }

  if (status === "error") {
    return (
      <ScreenContainer>
        <ErrorState message={error} onRetry={() => router.replace("/(app)/queue")} />
      </ScreenContainer>
    );
  }

  const minutes = String(Math.floor(waitedSeconds / 60)).padStart(2, "0");
  const seconds = String(waitedSeconds % 60).padStart(2, "0");

  return (
    <ScreenContainer>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.lg }}>
        <LoadingState
          label={status === "joining" ? "Finding you a match…" : "Waiting for someone to join…"}
        />
        {status === "waiting" ? (
          <Text style={[theme.typography.title, { color: theme.color.primary }]}>
            {minutes}:{seconds}
          </Text>
        ) : null}
        <Text
          style={[theme.typography.subtext, { color: theme.color.textSecondary, textAlign: "center" }]}
        >
          {status === "waiting" && waitedSeconds >= 60
            ? "Still nothing — try widening your filters for more matches."
            : status === "waiting" && waitedSeconds >= 30
              ? "Taking a bit longer than usual. Hang tight…"
              : "Hang tight — you'll be connected the moment someone compatible is ready."}
        </Text>
        {status === "waiting" && waitedSeconds >= 60 ? (
          <Button
            label="Widen filters"
            variant="secondary"
            onPress={async () => {
              await supabase.functions.invoke("queue-leave");
              router.replace("/(app)/preference-filter");
            }}
          />
        ) : null}
        <Button label="Cancel" variant="ghost" onPress={handleCancel} />
      </View>
    </ScreenContainer>
  );
}
