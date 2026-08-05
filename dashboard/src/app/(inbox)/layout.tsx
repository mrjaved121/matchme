import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { SidebarNav } from "../../components/SidebarNav";

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_operator, first_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_operator) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav
        userName={profile.first_name ?? user.email ?? "Operator"}
        isAdmin={profile.is_admin}
        isOperator={profile.is_operator}
      />
      <main className="flex-1 bg-background p-8">{children}</main>
    </div>
  );
}
