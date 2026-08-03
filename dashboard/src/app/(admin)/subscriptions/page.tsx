import { createClient } from "../../../lib/supabase/server";
import { StatTile } from "../../../components/StatTile";
import { SubscriptionsTable } from "../../../components/SubscriptionsTable";
import { SearchBox } from "../../../components/SearchBox";

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const [{ count: goldCount }, { count: expiringCount }, { count: referralGrantedCount }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_gold", true),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_gold", true)
      .lte("gold_expires_at", sevenDaysFromNow.toISOString()),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("referral_reward_granted", true),
  ]);

  let query = supabase
    .from("profiles")
    .select("id, first_name, is_gold, gold_expires_at, referral_reward_granted")
    .order("gold_expires_at", { ascending: true, nullsFirst: false });

  if (q) {
    query = query.ilike("first_name", `%${q}%`);
  } else {
    query = query.eq("is_gold", true);
  }

  const { data: users, error } = await query.limit(100);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
        <SearchBox placeholder="Search any user by first name…" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatTile label="Gold members" value={goldCount ?? 0} />
        <StatTile label="Expiring within 7 days" value={expiringCount ?? 0} />
        <StatTile label="Granted via referral" value={referralGrantedCount ?? 0} />
      </div>

      <p className="text-sm text-foreground-secondary">
        No real payment processor is connected yet — Gold is granted manually in-app (demo upgrade) or via the
        referral reward. Use this page to manually grant, extend, or revoke Gold for support cases.
      </p>

      {error ? (
        <p className="text-error">{error.message}</p>
      ) : (
        <SubscriptionsTable users={users ?? []} />
      )}
    </div>
  );
}
