"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../lib/supabase/client";
import { StatusBadge } from "./StatusBadge";

type User = {
  id: string;
  first_name: string | null;
  city: string | null;
  status: string;
  is_verified: boolean;
  is_admin: boolean;
  onboarding_completed: boolean;
  created_at: string;
};

export function UsersTable({ users }: { users: User[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function setStatus(userId: string, status: string) {
    setPendingId(userId);
    const supabase = createClient();
    await supabase.from("profiles").update({ status }).eq("id", userId);
    setPendingId(null);
    router.refresh();
  }

  if (users.length === 0) {
    return <p className="text-foreground-secondary">No users found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-foreground-secondary">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">City</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Onboarded</th>
            <th className="px-4 py-3 font-medium">Joined</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 text-foreground">
                {user.first_name ?? "—"}
                {user.is_admin ? (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    admin
                  </span>
                ) : null}
                {user.is_verified ? (
                  <span className="ml-2 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                    verified
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-foreground-secondary">{user.city ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={user.status} />
              </td>
              <td className="px-4 py-3 text-foreground-secondary">
                {user.onboarding_completed ? "Yes" : "No"}
              </td>
              <td className="px-4 py-3 text-foreground-secondary">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {user.status !== "active" ? (
                    <ActionButton
                      label="Reactivate"
                      onClick={() => setStatus(user.id, "active")}
                      pending={pendingId === user.id}
                    />
                  ) : null}
                  {user.status !== "suspended" ? (
                    <ActionButton
                      label="Suspend"
                      onClick={() => setStatus(user.id, "suspended")}
                      pending={pendingId === user.id}
                    />
                  ) : null}
                  {user.status !== "banned" ? (
                    <ActionButton
                      label="Ban"
                      danger
                      onClick={() => setStatus(user.id, "banned")}
                      pending={pendingId === user.id}
                    />
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
