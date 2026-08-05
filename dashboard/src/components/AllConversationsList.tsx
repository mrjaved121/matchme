"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";
import { formatConversationTime } from "../lib/formatConversationTime";

export type AllConversationRow = {
  matchId: string;
  matchedAt: string;
  operatorId: string;
  operatorName: string;
  otherProfile: {
    id: string;
    firstName: string | null;
    photoUrl: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isFromOperator: boolean;
  } | null;
  unreadCount: number;
  needsReply: boolean;
};

type IncomingMessage = {
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type Toast = { id: string; title: string; body: string };

export function AllConversationsList({
  conversations: initialConversations,
  operatorIds,
}: {
  conversations: AllConversationRow[];
  operatorIds: string[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);

  // Ask for browser notification permission once, up front.
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Clear the title-bar counter once the admin actually looks at the tab.
  useEffect(() => {
    function handleFocus() {
      setUnseenCount(0);
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  useEffect(() => {
    const baseTitle = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = unseenCount > 0 ? `(${unseenCount}) ${baseTitle}` : baseTitle;
  }, [unseenCount]);

  useEffect(() => {
    const matchIds = initialConversations.map((c) => c.matchId);
    if (matchIds.length === 0) return;

    const supabase = createClient();
    const channel = supabase
      .channel("inbox-all")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=in.(${matchIds.join(",")})`,
        },
        (payload) => {
          const message = payload.new as IncomingMessage;
          const fromOperator = operatorIds.includes(message.sender_id);

          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.matchId === message.match_id);
            if (idx === -1) return prev;

            const updated: AllConversationRow = {
              ...prev[idx],
              lastMessage: {
                content: message.content,
                createdAt: message.created_at,
                isFromOperator: fromOperator,
              },
              unreadCount: fromOperator ? prev[idx].unreadCount : prev[idx].unreadCount + 1,
              needsReply: !fromOperator,
            };

            const rest = [...prev];
            rest.splice(idx, 1);
            return [updated, ...rest];
          });

          if (!fromOperator) {
            const conversation = initialConversations.find((c) => c.matchId === message.match_id);
            const otherName = conversation?.otherProfile.firstName ?? "Someone";
            const operatorName = conversation?.operatorName ?? "an operator";
            const title = `New message for ${operatorName}`;
            const body = `${otherName}: ${message.content}`;
            const toastId = `${message.match_id}-${message.created_at}`;

            setToasts((prev) => [...prev, { id: toastId, title, body }]);
            setUnseenCount((prev) => prev + 1);
            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== toastId));
            }, 6000);

            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification(title, { body });
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialConversations, operatorIds]);

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="pointer-events-none fixed right-6 top-6 z-50 flex w-80 flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-2xl border border-border bg-surface p-4 shadow-lg"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{toast.title}</p>
              <button
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="text-xs text-foreground-secondary hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
            <p className="mt-1 truncate text-sm text-foreground-secondary">{toast.body}</p>
          </div>
        ))}
      </div>

      {conversations.length === 0 ? (
        <p className="text-foreground-secondary">No operator conversations yet.</p>
      ) : (
        conversations.map((conversation) => {
          const name = conversation.otherProfile.firstName ?? "Unknown";
          const time = conversation.lastMessage?.createdAt ?? conversation.matchedAt;
          const preview = conversation.lastMessage
            ? `${conversation.lastMessage.isFromOperator ? `${conversation.operatorName}: ` : ""}${conversation.lastMessage.content}`
            : "No messages yet";

          return (
            <Link
              key={conversation.matchId}
              href={`/inbox/${conversation.matchId}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:bg-background"
            >
              {conversation.otherProfile.photoUrl ? (
                <Image
                  src={conversation.otherProfile.photoUrl}
                  alt={name}
                  width={48}
                  height={48}
                  unoptimized
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background text-sm font-medium text-foreground-secondary">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-foreground-secondary">
                    {conversation.operatorName} <span aria-hidden="true">&rarr;</span>{" "}
                    <span className="font-medium text-foreground">{name}</span>
                  </p>
                  <p className="shrink-0 text-xs text-foreground-secondary">{formatConversationTime(time)}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-foreground-secondary">{preview}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    {conversation.needsReply ? (
                      <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
                        Needs reply
                      </span>
                    ) : null}
                    {conversation.unreadCount > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-white">
                        {conversation.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}
