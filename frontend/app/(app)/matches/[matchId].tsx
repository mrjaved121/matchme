import { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { TextField } from "../../../components/TextField";
import { ErrorState, LoadingState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";

type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

export default function Chat() {
  const theme = useTheme();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const myId = useAuthStore((s) => s.session!.user.id);

  const [otherName, setOtherName] = useState<string | null>(null);
  const [otherId, setOtherId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("id, user_a_id, user_b_id")
        .eq("id", matchId)
        .single();

      if (cancelled) return;
      if (matchError || !match) {
        setError("This match could not be found.");
        setLoading(false);
        return;
      }

      const other = match.user_a_id === myId ? match.user_b_id : match.user_a_id;
      setOtherId(other);

      const [{ data: profile }, { data: initialMessages }] = await Promise.all([
        supabase.from("profiles").select("first_name").eq("id", other).single(),
        supabase
          .from("messages")
          .select("*")
          .eq("match_id", matchId)
          .order("created_at", { ascending: true }),
      ]);

      if (cancelled) return;

      setOtherName(profile?.first_name ?? null);
      setMessages(initialMessages ?? []);
      setLoading(false);

      const unreadIds = (initialMessages ?? [])
        .filter((m) => m.sender_id !== myId && !m.read_at)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .in("id", unreadIds)
          .then(() => {});
      }
    }

    load();

    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [matchId, myId]);

  async function handleSend() {
    const content = draft.trim();
    if (!content) return;
    setDraft("");

    const { error: sendError } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: myId, content });

    if (sendError) setError(sendError.message);
  }

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState label="Loading conversation…" />
      </ScreenContainer>
    );
  }

  if (error && messages.length === 0) {
    return (
      <ScreenContainer>
        <ErrorState message={error} onRetry={() => router.back()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: theme.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.color.border,
        }}
      >
        <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>
          {otherName ?? "Chat"}
        </Text>
        <Pressable
          onPress={() => otherId && router.push({ pathname: "/(app)/report/[targetUserId]", params: { targetUserId: otherId } })}
        >
          <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>Report</Text>
        </Pressable>
      </View>

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
            <TextField placeholder="Message" value={draft} onChangeText={setDraft} onSubmitEditing={handleSend} />
          </View>
          <Pressable
            onPress={handleSend}
            style={{
              width: 52,
              height: 52,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.color.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 18 }}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
