import { createClient } from "../../../lib/supabase/server";
import { UsersTable } from "../../../components/UsersTable";
import { SearchBox } from "../../../components/SearchBox";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("id, first_name, city, status, is_verified, is_admin, onboarding_completed, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (q) {
    query = query.ilike("first_name", `%${q}%`);
  }

  const { data: users, error } = await query;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <SearchBox placeholder="Search by first name…" />
      </div>

      {error ? (
        <p className="text-error">{error.message}</p>
      ) : (
        <UsersTable users={users ?? []} />
      )}
    </div>
  );
}
