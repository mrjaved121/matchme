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

  const reportedIds = [
    ...new Set((reports ?? []).map((r) => (r as unknown as ReportRow).reported?.id).filter(Boolean)),
  ] as string[];

  const { data: photos } = reportedIds.length
    ? await supabase
        .from("profile_photos")
        .select("id, profile_id, storage_path")
        .in("profile_id", reportedIds)
        .order("position", { ascending: true })
    : { data: [] };

  const photosByProfile = new Map<string, { id: string; url: string }[]>();
  for (const photo of photos ?? []) {
    const url = supabase.storage.from("profile-photos").getPublicUrl(photo.storage_path).data.publicUrl;
    const list = photosByProfile.get(photo.profile_id) ?? [];
    list.push({ id: photo.id, url });
    photosByProfile.set(photo.profile_id, list);
  }

  const rows = (reports ?? []).map((r) => {
    const row = r as unknown as ReportRow;
    return { ...row, reportedPhotos: row.reported ? (photosByProfile.get(row.reported.id) ?? []) : [] };
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">Reports</h1>

      {error ? (
        <p className="text-error">{error.message}</p>
      ) : (
        <ReportsTable reports={rows} />
      )}
    </div>
  );
}
