import { createClient } from "../../../lib/supabase/server";
import { StatTile } from "../../../components/StatTile";
import { SessionsChart } from "../../../components/SessionsChart";

function bucketByDay(
  sessions: { started_at: string }[],
  matches: { matched_at: string }[],
  days: number,
) {
  const buckets = new Map<string, { sessions: number; matches: number }>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), { sessions: 0, matches: 0 });
  }

  for (const row of sessions) {
    const bucket = buckets.get(row.started_at.slice(0, 10));
    if (bucket) bucket.sessions += 1;
  }
  for (const row of matches) {
    const bucket = buckets.get(row.matched_at.slice(0, 10));
    if (bucket) bucket.matches += 1;
  }

  return Array.from(buckets.entries()).map(([date, counts]) => ({
    date: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    ...counts,
  }));
}

export default async function ActivityPage() {
  const supabase = await createClient();
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [
    { count: queueSize },
    { count: activeSessions },
    { data: recentSessions },
    { data: recentMatches },
  ] = await Promise.all([
    supabase.from("speed_dating_queue").select("*", { count: "exact", head: true }),
    supabase.from("date_sessions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("date_sessions").select("started_at").gte("started_at", fourteenDaysAgo.toISOString()),
    supabase.from("matches").select("matched_at").gte("matched_at", fourteenDaysAgo.toISOString()),
  ]);

  const chartData = bucketByDay(recentSessions ?? [], recentMatches ?? [], 14);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-foreground">Activity</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
        <StatTile label="People in queue right now" value={queueSize ?? 0} />
        <StatTile label="Dates in progress" value={activeSessions ?? 0} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-sm font-medium text-foreground-secondary">Dates &amp; matches, last 14 days</h2>
        <SessionsChart data={chartData} />
      </div>
    </div>
  );
}
