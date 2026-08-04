import { useEffect, useRef, useState } from "react";
import { Alert, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { ErrorState, LoadingState } from "../../../components/StateViews";
import { useTheme } from "../../../theme/useTheme";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";
import { publicPhotoUrl } from "../../../lib/photoUrl";

type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

// Matches design/stitch_just_spark_ui_kit/chat_with_marcus/code.html: a
// header with a back button + small avatar-with-online-dot + presence
// caption, asymmetric-corner message bubbles (incoming: light, tail
// bottom-left / outgoing: primary, tail bottom-right) each with an avatar
// and a timestamp, a "Today" date divider, and a pill input with a send
// button that only lights up once there's text. The export's checkmark
// (single = sent, double primary = read) is wired to this app's real
// read_at/read_receipts data instead of being decorative.
export default function Chat() {
  const theme = useTheme();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const myId = useAuthStore((s) => s.session!.user.id);
  const queryClient = useQueryClient();

  const [otherName, setOtherName] = useState<string | null>(null);
  const [otherId, setOtherId] = useState<string | null>(null);
  const [otherPhoto, setOtherPhoto] = useState<string | null>(null);
  const [otherReadReceipts, setOtherReadReceipts] = useState(true);
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

      const [{ data: profile }, { data: photo }, { data: initialMessages }] = await Promise.all([
        supabase.from("profiles").select("first_name, read_receipts").eq("id", other).single(),
        supabase
          .from("profile_photos")
          .select("storage_path")
          .eq("profile_id", other)
          .order("position", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("messages")
          .select("*")
          .eq("match_id", matchId)
          .order("created_at", { ascending: true }),
      ]);

      if (cancelled) return;

      setOtherName(profile?.first_name ?? null);
      setOtherPhoto(photo?.storage_path ? publicPhotoUrl(photo.storage_path) : null);
      // Whether the OTHER person has Read Receipts enabled — controls
      // whether I get to see "Seen"/double-check on messages I sent them.
      // read_at itself is always recorded regardless, so the reader's own
      // unread badge (computed from read_at elsewhere) stays accurate either way.
      setOtherReadReceipts(profile?.read_receipts ?? true);
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
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
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

  const canSend = draft.trim().length > 0;

  return (
    <ScreenContainer padded={false}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: theme.spacing.screen,
          paddingVertical: theme.spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.color.inputFill,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color={theme.color.textPrimary} />
        </Pressable>

        <Pressable
          onPress={() => otherId && router.push({ pathname: "/(app)/profile/[userId]", params: { userId: otherId } })}
          style={{ alignItems: "center" }}
        >
          <View style={{ width: 44, height: 44, marginBottom: 2 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, overflow: "hidden", backgroundColor: theme.color.surfaceSecondary }}>
              {otherPhoto ? (
                <Image source={{ uri: otherPhoto }} style={{ width: "100%", height: "100%" }} />
              ) : (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontWeight: "700", color: theme.color.primary }}>{otherName?.[0]?.toUpperCase() ?? "?"}</Text>
                </View>
              )}
            </View>
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 13,
                height: 13,
                borderRadius: 7,
                backgroundColor: theme.color.online,
                borderWidth: 2,
                borderColor: theme.color.background,
              }}
            />
          </View>
          <Text style={[theme.typography.label, { color: theme.color.textPrimary }]}>{otherName ?? "Chat"}</Text>
          <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>
            {otherTyping ? "typing…" : "Active now"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            Alert.alert(otherName ?? "Options", undefined, [
              { text: "Unmatch", style: "destructive", onPress: confirmUnmatch },
              {
                text: "Report",
                style: "destructive",
                onPress: () => otherId && router.push({ pathname: "/(app)/report/[targetUserId]", params: { targetUserId: otherId } }),
              },
              { text: "Cancel", style: "cancel" },
            ])
          }
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.color.inputFill,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={theme.color.textPrimary} />
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
          contentContainerStyle={{ gap: theme.spacing.md, padding: theme.spacing.screen }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            messages.length > 0 ? (
              <View style={{ alignItems: "center", marginBottom: theme.spacing.sm }}>
                <View style={{ backgroundColor: theme.color.inputFill, paddingHorizontal: 12, paddingVertical: 4, borderRadius: theme.radius.pill }}>
                  <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>Today</Text>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const mine = item.sender_id === myId;
            const time = new Date(item.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
            const read = mine && otherReadReceipts && !!item.read_at;

            return (
              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                {!mine ? (
                  <View style={{ width: 28, height: 28, borderRadius: 14, overflow: "hidden", backgroundColor: theme.color.surfaceSecondary }}>
                    {otherPhoto ? <Image source={{ uri: otherPhoto }} style={{ width: "100%", height: "100%" }} /> : null}
                  </View>
                ) : null}
                <View style={{ alignItems: mine ? "flex-end" : "flex-start", gap: 4 }}>
                  <View
                    style={{
                      backgroundColor: mine ? theme.color.primary : theme.color.inputFill,
                      borderRadius: 18,
                      borderBottomRightRadius: mine ? 4 : 18,
                      borderBottomLeftRadius: mine ? 18 : 4,
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                      ...(mine ? theme.shadow.floating : theme.shadow.card),
                    }}
                  >
                    <Text style={[theme.typography.body, { color: mine ? "#FFFFFF" : theme.color.textPrimary }]}>{item.content}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={[theme.typography.caption, { color: theme.color.textSecondary }]}>{time}</Text>
                    {mine ? (
                      <Ionicons name={read ? "checkmark-done" : "checkmark"} size={14} color={read ? theme.color.primary : theme.color.textSecondary} />
                    ) : null}
                  </View>
                </View>
              </View>
            );
          }}
        />

        <View style={{ paddingHorizontal: theme.spacing.screen, paddingVertical: theme.spacing.sm }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.sm,
              backgroundColor: theme.color.inputFill,
              borderRadius: theme.radius.pill,
              paddingLeft: theme.spacing.sm,
              paddingRight: 4,
              paddingVertical: 4,
            }}
          >
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor={theme.color.textSecondary}
              value={draft}
              onChangeText={handleDraftChange}
              onSubmitEditing={handleSend}
              style={[theme.typography.body, { flex: 1, color: theme.color.textPrimary, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.sm }]}
            />
            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: canSend ? theme.color.primary : theme.color.surfaceSecondary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="send" size={18} color={canSend ? "#FFFFFF" : theme.color.textSecondary} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
