"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "../lib/supabase/client";

export type VerificationRow = {
  id: string;
  firstName: string | null;
  profilePhotoUrl: string | null;
  selfiePath: string | null;
  selfieUrl?: string | null;
};

export function VerificationTable({ rows }: { rows: VerificationRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function decide(profileId: string, approve: boolean) {
    setPendingId(profileId);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({
        verification_status: approve ? "approved" : "rejected",
        is_verified: approve,
      })
      .eq("id", profileId);
    setPendingId(null);
    router.refresh();
  }

  if (rows.length === 0) {
    return <p className="text-foreground-secondary">No pending verifications.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.id} className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <PhotoTile label="Profile photo" url={row.profilePhotoUrl} />
              <PhotoTile label="Verification selfie" url={row.selfieUrl} />
            </div>
            <p className="font-semibold text-foreground">{row.firstName ?? "Unknown"}</p>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => decide(row.id, true)}
              disabled={pendingId === row.id}
              className="rounded-full border border-success px-3 py-1 text-xs font-medium text-success transition hover:bg-success/10 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => decide(row.id, false)}
              disabled={pendingId === row.id}
              className="rounded-full border border-error px-3 py-1 text-xs font-medium text-error transition hover:bg-error/10 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PhotoTile({ label, url }: { label: string; url: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-foreground-secondary">{label}</p>
      {url ? (
        <Image
          src={url}
          alt={label}
          width={112}
          height={112}
          unoptimized
          className="h-28 w-28 rounded-xl border border-border object-cover"
        />
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-border bg-background text-xs text-foreground-secondary">
          None
        </div>
      )}
    </div>
  );
}
