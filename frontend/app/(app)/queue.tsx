import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
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
  const matchedRef = useRef(false);

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
          router.replace({ pathname: "/(app)/date/[sessionId]", params: { sessionId: payload.new.id } });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "date_sessions", filter: `user_b_id=eq.${userId}` },
        (payload) => {
          matchedRef.current = true;
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

  return (
    <ScreenContainer>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.lg }}>
        <LoadingState
          label={status === "joining" ? "Finding you a match…" : "Waiting for someone to join…"}
        />
        <Text
          style={[theme.typography.subtext, { color: theme.color.textSecondary, textAlign: "center" }]}
        >
          Hang tight — you'll be connected the moment someone compatible is ready.
        </Text>
        <Button label="Cancel" variant="ghost" onPress={handleCancel} />
      </View>
    </ScreenContainer>
  );
}
