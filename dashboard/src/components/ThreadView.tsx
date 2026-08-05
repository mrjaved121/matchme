"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "../lib/supabase/client";

export type ThreadMessage = {
  id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ThreadView({
  matchId,
  currentUserId,
  otherProfile,
  initialMessages,
  readOnly = false,
  operatorId,
}: {
  matchId: string;
  currentUserId: string;
  otherProfile: { id: string; firstName: string | null; photoUrl: string | null };
  initialMessages: ThreadMessage[];
  /** True when the viewer isn't a match participant (super-admin monitoring). */
  readOnly?: boolean;
  /** Operator's profile id, used to align their bubbles right when readOnly. */
  operatorId?: string;
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const rightAlignedSenderId = readOnly ? operatorId : currentUserId;

  // Mark any incoming, unread messages as read now that the thread is open.
  // Only meaningful for an actual participant, not a monitoring admin.
  useEffect(() => {
    if (readOnly) return;
    const hasUnread = initialMessages.some((m) => m.sender_id !== currentUserId && !m.read_at);
    if (!hasUnread) return;

    const supabase = createClient();
    const now = new Date().toISOString();

    supabase
      .from("messages")
      .update({ read_at: now })
      .eq("match_id", matchId)
      .neq("sender_id", currentUserId)
      .is("read_at", null)
      .then(() => {
        setMessages((prev) =>
          prev.map((m) => (m.sender_id !== currentUserId && !m.read_at ? { ...m, read_at: now } : m)),
        );
      });
    // Only meant to run once on mount, against the server-rendered snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, currentUserId, readOnly]);

  // Live-append new messages, and mark freshly-arrived incoming ones as read
  // since the thread is already open.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const incoming = payload.new as ThreadMessage;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));

          if (!readOnly && incoming.sender_id !== currentUserId && !incoming.read_at) {
            supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", incoming.id).then();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, currentUserId, readOnly]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function sendMessage() {
    const content = draft.trim();
    if (!content || sending) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMessage: ThreadMessage = {
      id: tempId,
      sender_id: currentUserId,
      content,
      read_at: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setDraft("");
    setSendError(null);
    setSending(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: currentUserId, content })
      .select("id, sender_id, content, read_at, created_at")
      .single();

    setSending(false);

    if (error || !data) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setSendError("Message failed to send.");
      return;
    }

    setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  const name = otherProfile.firstName ?? "Unknown";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        {otherProfile.photoUrl ? (
          <Image
            src={otherProfile.photoUrl}
            alt={name}
            width={40}
            height={40}
            unoptimized
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-sm font-medium text-foreground-secondary">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <p className="font-semibold text-foreground">{name}</p>
        {readOnly ? (
          <span className="ml-2 rounded-full bg-foreground-secondary/10 px-2.5 py-1 text-xs font-medium text-foreground-secondary">
            Viewing only
          </span>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <p className="text-sm text-foreground-secondary">No messages yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => {
              const isRight = message.sender_id === rightAlignedSenderId;
              const isMine = !readOnly && message.sender_id === currentUserId;
              return (
                <div key={message.id} className={`flex flex-col ${isRight ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-md rounded-2xl px-4 py-2 text-sm ${
                      isRight ? "bg-primary text-white" : "border border-border bg-surface text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                  <p className="mt-1 text-xs text-foreground-secondary">
                    {formatTimestamp(message.created_at)}
                    {isMine ? ` · ${message.read_at ? "Read" : "Sent"}` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {readOnly ? null : (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          {sendError ? <p className="text-xs text-error">{sendError}</p> : null}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, 2000))}
              onKeyDown={handleKeyDown}
              placeholder="Write a reply…"
              rows={1}
              aria-label="Reply message"
              className="flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !draft.trim()}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
