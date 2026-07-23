import { useEffect, useState } from "react";
import { router } from "expo-router";
import { supabase } from "./supabase";
import { useAuthStore } from "../store/authStore";

export type SessionRow = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  duration_seconds: number;
  status: string;
};

export type OtherProfile = {
  id: string;
  first_name: string | null;
  photoPath: string | null;
};

export function formatTimer(secondsLeft: number): string {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Shared across the native and web variants of the date session screen:
// loads the session + other participant, runs the countdown, and navigates
// to the decision screen when it hits zero or the user ends the call.
export function useDateSession(sessionId: string) {
  const myId = useAuthStore((s) => s.session!.user.id);

  const [session, setSession] = useState<SessionRow | null>(null);
  const [other, setOther] = useState<OtherProfile | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: sessionRow, error: sessionError } = await supabase
        .from("date_sessions")
        .select("id, user_a_id, user_b_id, duration_seconds, status")
        .eq("id", sessionId)
        .single();

      if (cancelled) return;

      if (sessionError || !sessionRow) {
        setError("This date session could not be found.");
        return;
      }

      setSession(sessionRow);
      setSecondsLeft(sessionRow.duration_seconds);

      const otherId = sessionRow.user_a_id === myId ? sessionRow.user_b_id : sessionRow.user_a_id;

      const [{ data: otherProfile }, { data: photos }] = await Promise.all([
        supabase.from("profiles").select("id, first_name").eq("id", otherId).single(),
        supabase
          .from("profile_photos")
          .select("storage_path")
          .eq("profile_id", otherId)
          .order("position", { ascending: true })
          .limit(1),
      ]);

      if (cancelled) return;

      setOther({
        id: otherId,
        first_name: otherProfile?.first_name ?? null,
        photoPath: photos?.[0]?.storage_path ?? null,
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId, myId]);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      goToDecision();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => (s ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  function goToDecision() {
    router.replace({ pathname: "/(app)/decision/[sessionId]", params: { sessionId } });
  }

  return { session, other, error, secondsLeft, goToDecision };
}
