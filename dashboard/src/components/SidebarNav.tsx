"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/activity", label: "Activity" },
  { href: "/users", label: "Users" },
  { href: "/reports", label: "Reports" },
  { href: "/verification", label: "Verification" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/app-config", label: "App Config" },
];

export function SidebarNav({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-60 flex-col justify-between border-r border-border bg-surface p-6">
      <div>
        <p className="text-lg font-bold text-foreground">Spark</p>
        <p className="text-sm text-foreground-secondary">Admin</p>

        <nav className="mt-8 flex flex-col gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-primary text-white"
                    : "text-foreground-secondary hover:bg-background"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-2">
        <p className="truncate text-sm text-foreground-secondary">{adminName}</p>
        <button
          onClick={handleSignOut}
          className="rounded-xl border border-border px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-background"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
