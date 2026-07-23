"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { StatusBadge } from "./StatusBadge";

export type ReportRow = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter: { id: string; first_name: string | null } | null;
  reported: { id: string; first_name: string | null } | null;
};

export function ReportsTable({ reports }: { reports: ReportRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function updateReport(reportId: string, status: string) {
    setPendingId(reportId);
    const supabase = createClient();
    await supabase
      .from("reports")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", reportId);
    setPendingId(null);
    router.refresh();
  }

  async function banReportedUser(reportId: string, reportedUserId: string) {
    setPendingId(reportId);
    const supabase = createClient();
    await supabase.from("profiles").update({ status: "banned" }).eq("id", reportedUserId);
    await supabase
      .from("reports")
      .update({ status: "actioned", reviewed_at: new Date().toISOString() })
      .eq("id", reportId);
    setPendingId(null);
    router.refresh();
  }

  if (reports.length === 0) {
    return <p className="text-foreground-secondary">No reports.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {reports.map((report) => (
        <div
          key={report.id}
          className="rounded-2xl border border-border bg-surface p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-foreground">
                <span className="font-semibold">{report.reporter?.first_name ?? "Unknown"}</span>{" "}
                reported{" "}
                <span className="font-semibold">{report.reported?.first_name ?? "Unknown"}</span>
              </p>
              <p className="text-sm capitalize text-foreground-secondary">
                Reason: {report.reason.replace(/_/g, " ")}
              </p>
              {report.details ? (
                <p className="text-sm text-foreground-secondary">"{report.details}"</p>
              ) : null}
              <p className="text-xs text-foreground-secondary">
                {new Date(report.created_at).toLocaleString()}
              </p>
            </div>
            <StatusBadge status={report.status} />
          </div>

          {report.status === "pending" ? (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => updateReport(report.id, "dismissed")}
                disabled={pendingId === report.id}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition hover:bg-background disabled:opacity-50"
              >
                Dismiss
              </button>
              <button
                onClick={() => updateReport(report.id, "reviewed")}
                disabled={pendingId === report.id}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition hover:bg-background disabled:opacity-50"
              >
                Mark reviewed
              </button>
              {report.reported ? (
                <button
                  onClick={() => banReportedUser(report.id, report.reported!.id)}
                  disabled={pendingId === report.id}
                  className="rounded-full border border-error px-3 py-1 text-xs font-medium text-error transition hover:bg-error/10 disabled:opacity-50"
                >
                  Ban reported user
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
