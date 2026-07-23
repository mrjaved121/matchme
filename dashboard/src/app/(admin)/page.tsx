import { createClient } from "../../lib/supabase/server";
import { StatTile } from "../../components/StatTile";
import { SignupsChart } from "../../components/SignupsChart";

function bucketSignupsByDay(rows: { created_at: string }[], days: number) {
  const buckets = new Map<string, number>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const row of rows) {
    const key = row.created_at.slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    count,
  }));
}

export default async function OverviewPage() {
  const supabase = await createClient();
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: totalMatches },
    { count: completedSessions },
    { count: totalSessions },
    { count: pendingReports },
    { data: recentSignups },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase
      .from("date_sessions")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase.from("date_sessions").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", fourteenDaysAgo.toISOString()),
  ]);

  const matchRate =
    completedSessions && completedSessions > 0
      ? Math.round(((totalMatches ?? 0) / completedSessions) * 100)
      : 0;

  const chartData = bucketSignupsByDay(recentSignups ?? [], 14);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-foreground">Overview</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Total users" value={totalUsers ?? 0} />
        <StatTile label="Active users" value={activeUsers ?? 0} />
        <StatTile label="Dates started" value={totalSessions ?? 0} />
        <StatTile label="Dates completed" value={completedSessions ?? 0} />
        <StatTile label="Matches made" value={totalMatches ?? 0} />
        <StatTile label="Match rate" value={`${matchRate}%`} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-sm font-medium text-foreground-secondary">Signups, last 14 days</h2>
        <SignupsChart data={chartData} />
      </div>

      {pendingReports && pendingReports > 0 ? (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">
          <span className="font-semibold">{pendingReports}</span> report
          {pendingReports === 1 ? "" : "s"} awaiting review.{" "}
          <a href="/reports" className="font-semibold text-primary underline">
            Go to Reports
          </a>
        </div>
      ) : null}
    </div>
  );
}
