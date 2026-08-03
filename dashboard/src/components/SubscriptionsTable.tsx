"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../lib/supabase/client";

type SubscriptionUser = {
  id: string;
  first_name: string | null;
  is_gold: boolean;
  gold_expires_at: string | null;
  referral_reward_granted: boolean;
};

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function SubscriptionsTable({ users }: { users: SubscriptionUser[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function extend(user: SubscriptionUser, days: number) {
    setPendingId(user.id);
    const supabase = createClient();
    const base = user.gold_expires_at && new Date(user.gold_expires_at) > new Date() ? new Date(user.gold_expires_at) : new Date();
    await supabase
      .from("profiles")
      .update({ is_gold: true, gold_expires_at: addDays(base, days).toISOString() })
      .eq("id", user.id);
    setPendingId(null);
    router.refresh();
  }

  async function revoke(user: SubscriptionUser) {
    if (!window.confirm(`Revoke Gold from ${user.first_name ?? "this user"}?`)) return;
    setPendingId(user.id);
    const supabase = createClient();
    await supabase.from("profiles").update({ is_gold: false, gold_expires_at: null }).eq("id", user.id);
    setPendingId(null);
    router.refresh();
  }

  if (users.length === 0) {
    return <p className="text-foreground-secondary">No matching users.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-foreground-secondary">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Gold</th>
            <th className="px-4 py-3 font-medium">Expires</th>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 text-foreground">{user.first_name ?? "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    user.is_gold ? "bg-warning/10 text-warning" : "bg-border text-foreground-secondary"
                  }`}
                >
                  {user.is_gold ? "Active" : "None"}
                </span>
              </td>
              <td className="px-4 py-3 text-foreground-secondary">
                {user.gold_expires_at ? new Date(user.gold_expires_at).toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-3 text-foreground-secondary">
                {user.referral_reward_granted ? "Referral" : "Manual"}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <ActionButton label="+1 week" onClick={() => extend(user, 7)} pending={pendingId === user.id} />
                  <ActionButton label="+1 month" onClick={() => extend(user, 30)} pending={pendingId === user.id} />
                  {user.is_gold ? (
                    <ActionButton label="Revoke" danger onClick={() => revoke(user)} pending={pendingId === user.id} />
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  pending,
  danger,
}: {
  label: string;
  onClick: () => void;
  pending: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
        danger
          ? "border-error text-error hover:bg-error/10"
          : "border-border text-foreground hover:bg-background"
      }`}
    >
      {label}
    </button>
  );
}
