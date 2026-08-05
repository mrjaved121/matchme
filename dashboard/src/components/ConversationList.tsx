"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";
import { formatConversationTime } from "../lib/formatConversationTime";

export type ConversationRow = {
  matchId: string;
  matchedAt: string;
  otherProfile: {
    id: string;
    firstName: string | null;
    photoUrl: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isMine: boolean;
  } | null;
  unreadCount: number;
};

type IncomingMessage = {
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export function ConversationList({
  conversations: initialConversations,
  currentUserId,
}: {
  conversations: ConversationRow[];
  currentUserId: string;
}) {
  const [conversations, setConversations] = useState(initialConversations);

  useEffect(() => {
    const matchIds = initialConversations.map((c) => c.matchId);
    if (matchIds.length === 0) return;

    const supabase = createClient();
    const channel = supabase
      .channel("inbox-list")
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
          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.matchId === message.match_id);
            if (idx === -1) return prev;

            const updated: ConversationRow = {
              ...prev[idx],
              lastMessage: {
                content: message.content,
                createdAt: message.created_at,
                isMine: message.sender_id === currentUserId,
              },
              unreadCount:
                message.sender_id === currentUserId ? prev[idx].unreadCount : prev[idx].unreadCount + 1,
            };

            const rest = [...prev];
            rest.splice(idx, 1);
            return [updated, ...rest];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialConversations, currentUserId]);

  if (conversations.length === 0) {
    return <p className="text-foreground-secondary">No conversations yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {conversations.map((conversation) => {
        const name = conversation.otherProfile.firstName ?? "Unknown";
        const time = conversation.lastMessage?.createdAt ?? conversation.matchedAt;
        const preview = conversation.lastMessage
          ? `${conversation.lastMessage.isMine ? "You: " : ""}${conversation.lastMessage.content}`
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
                <p className="truncate font-medium text-foreground">{name}</p>
                <p className="shrink-0 text-xs text-foreground-secondary">{formatConversationTime(time)}</p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm text-foreground-secondary">{preview}</p>
                {conversation.unreadCount > 0 ? (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-white">
                    {conversation.unreadCount}
                  </span>
                ) : null}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
