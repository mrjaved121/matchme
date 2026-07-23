import { createClient } from "../../../lib/supabase/server";
import { ReportsTable, type ReportRow } from "../../../components/ReportsTable";

export default async function ReportsPage() {
  const supabase = await createClient();

  const { data: reports, error } = await supabase
    .from("reports")
    .select(
      `id, reason, details, status, created_at,
       reporter:profiles!reports_reporter_id_fkey(id, first_name),
       reported:profiles!reports_reported_id_fkey(id, first_name)`,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">Reports</h1>

      {error ? (
        <p className="text-error">{error.message}</p>
      ) : (
        <ReportsTable reports={(reports ?? []) as unknown as ReportRow[]} />
      )}
    </div>
  );
}
