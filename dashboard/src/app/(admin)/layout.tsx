import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { SidebarNav } from "../../components/SidebarNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, first_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav adminName={profile.first_name ?? user.email ?? "Admin"} />
      <main className="flex-1 bg-background p-8">{children}</main>
    </div>
  );
}
