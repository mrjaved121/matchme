import { useEffect, useRef, useState } from "react";
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { TextField } from "../../../components/TextField";
import { Button } from "../../../components/Button";
import { LoadingState, ErrorState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";
import { publicPhotoUrl } from "../../../lib/photoUrl";
import { formatTimer, useDateSession } from "../../../lib/useDateSession";
import { ICEBREAKER_PROMPTS } from "../../../lib/constants";

type SessionMessage = {
  id: string;
  session_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function DateSession() {
  const theme = useTheme();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const myId = useAuthStore((s) => s.session!.user.id);
  const { session, other, error, secondsLeft, goToDecision } = useDateSession(sessionId);

  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<SessionMessage>>(null);
  const [icebreaker] = useState(
    () => ICEBREAKER_PROMPTS[Math.floor(Math.random() * ICEBREAKER_PROMPTS.length)],
  );
  const [icebreakerDismissed, setIcebreakerDismissed] = useState(false);

  const elapsedSeconds = session ? session.duration_seconds - (secondsLeft ?? session.duration_seconds) : 0;
  const showIcebreaker = !icebreakerDismissed && messages.length === 0 && elapsedSeconds < 120;

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    supabase
      .from("date_session_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setMessages(data ?? []);
      });

    const channel = supabase
      .channel(`date-session-chat-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "date_session_messages", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as SessionMessage]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [session, sessionId]);

  async function handleSend() {
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    await supabase.from("date_session_messages").insert({ session_id: sessionId, sender_id: myId, content });
  }

  if (error) {
    return (
      <ScreenContainer>
        <ErrorState message={error} />
      </ScreenContainer>
    );
  }

  if (!session || !other || secondsLeft === null) {
    return (
      <ScreenContainer>
        <LoadingState label="Connecting…" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: theme.spacing.sm,
          gap: theme.spacing.sm,
        }}
      >
        {other.photoPath ? (
          <Image
            source={{ uri: publicPhotoUrl(other.photoPath) }}
            style={{ width: 36, height: 36, borderRadius: 18 }}
          />
        ) : (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.color.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 15 }}>{other.first_name?.[0]?.toUpperCase() ?? "?"}</Text>
          </View>
        )}
        <Text style={[theme.typography.body, { color: theme.color.textPrimary, fontWeight: "700" }]}>
          {other.first_name ?? "Your date"}
        </Text>
      </View>

      {/* The clock is the whole point of a timed date — give it the visual
          weight of a hero element, not a corner badge, and let it read as
          urgent once the round is nearly over. */}
      <LinearGradient
        colors={secondsLeft <= 30 ? [theme.color.error, "#FF7A5C"] : theme.color.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: theme.radius.card,
          paddingVertical: theme.spacing.md,
          alignItems: "center",
          marginBottom: theme.spacing.sm,
          shadowColor: secondsLeft <= 30 ? theme.color.error : theme.color.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 5,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 36, letterSpacing: 1, fontVariant: ["tabular-nums"] }}>
          {formatTimer(secondsLeft)}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12.5, marginTop: 2 }}>
          This chat ends when the timer runs out — say hello!
        </Text>
      </LinearGradient>

      {showIcebreaker ? (
        <Pressable
          onPress={() => {
            setDraft(icebreaker);
            setIcebreakerDismissed(true);
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: theme.spacing.sm,
            backgroundColor: theme.color.surface,
            borderWidth: 1,
            borderColor: theme.color.border,
            borderRadius: theme.radius.card,
            padding: theme.spacing.sm,
            marginBottom: theme.spacing.xs,
          }}
        >
          <Text style={[theme.typography.subtext, { color: theme.color.textPrimary, flex: 1 }]}>
            💡 {icebreaker}
          </Text>
          <Pressable onPress={() => setIcebreakerDismissed(true)} hitSlop={8}>
            <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>✕</Text>
          </Pressable>
        </Pressable>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.xs, paddingVertical: theme.spacing.md }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const mine = item.sender_id === myId;
            return (
              <View
                style={{
                  alignSelf: mine ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  backgroundColor: mine ? theme.color.primary : theme.color.surface,
                  borderWidth: mine ? 0 : 1,
                  borderColor: theme.color.border,
                  borderRadius: theme.radius.card,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                }}
              >
                <Text style={[theme.typography.body, { color: mine ? "#FFFFFF" : theme.color.textPrimary }]}>
                  {item.content}
                </Text>
              </View>
            );
          }}
        />

        <View style={{ flexDirection: "row", gap: theme.spacing.sm, paddingVertical: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <TextField placeholder="Say something…" value={draft} onChangeText={setDraft} onSubmitEditing={handleSend} />
          </View>
          <Button label="Send" onPress={handleSend} />
        </View>

        <Button label="End date now" variant="ghost" onPress={goToDecision} />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
