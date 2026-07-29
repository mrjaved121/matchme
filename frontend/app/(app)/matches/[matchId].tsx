import { useEffect, useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const [otherName, setOtherName] = useState<string | null>(null);
  const [otherId, setOtherId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [otherTyping, setOtherTyping] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingSendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          .then(() => queryClient.invalidateQueries({ queryKey: ["matches", myId] }));
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
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.userId === myId) return;
        setOtherTyping(true);
        if (typingClearTimer.current) clearTimeout(typingClearTimer.current);
        typingClearTimer.current = setTimeout(() => setOtherTyping(false), 3000);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (typingClearTimer.current) clearTimeout(typingClearTimer.current);
      if (typingSendTimer.current) clearTimeout(typingSendTimer.current);
    };
  }, [matchId, myId]);

  // Throttled to at most one broadcast per 1.5s while typing, rather than
  // one per keystroke.
  function handleDraftChange(text: string) {
    setDraft(text);
    if (typingSendTimer.current) return;
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId: myId } });
    typingSendTimer.current = setTimeout(() => {
      typingSendTimer.current = null;
    }, 1500);
  }

  function confirmUnmatch() {
    Alert.alert(
      `Unmatch ${otherName ?? "this person"}?`,
      "You'll no longer see each other in matches, and this conversation will disappear. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Unmatch", style: "destructive", onPress: handleUnmatch },
      ],
    );
  }

  async function handleUnmatch() {
    const { error: unmatchError } = await supabase
      .from("matches")
      .update({ status: "unmatched" })
      .eq("id", matchId);

    if (unmatchError) {
      Alert.alert("Couldn't unmatch", unmatchError.message);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["matches", myId] });
    router.replace("/(app)/matches");
  }

  async function handleSend() {
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

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
        <View>
          <Text style={[theme.typography.title, { color: theme.color.textPrimary }]}>
            {otherName ?? "Chat"}
          </Text>
          {otherTyping ? (
            <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>
              typing…
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
          <Pressable onPress={confirmUnmatch}>
            <Text style={[theme.typography.subtext, { color: theme.color.textSecondary }]}>Unmatch</Text>
          </Pressable>
          <Pressable
            onPress={() => otherId && router.push({ pathname: "/(app)/report/[targetUserId]", params: { targetUserId: otherId } })}
          >
            <Text style={[theme.typography.subtext, { color: theme.color.error }]}>Report</Text>
          </Pressable>
        </View>
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
            <TextField placeholder="Message" value={draft} onChangeText={handleDraftChange} onSubmitEditing={handleSend} />
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
