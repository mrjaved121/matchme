import { createClient } from "../../../lib/supabase/server";
import { AppConfigForm } from "../../../components/AppConfigForm";

export default async function AppConfigPage() {
  const supabase = await createClient();
  const { data: config, error } = await supabase.from("app_config").select("*").single();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">App Config</h1>
      <p className="text-sm text-foreground-secondary">
        Live settings the mobile app reads at runtime — changes take effect immediately, no app update or
        redeploy needed.
      </p>

      {error || !config ? (
        <p className="text-error">{error?.message ?? "Config row not found."}</p>
      ) : (
        <AppConfigForm config={config} />
      )}
    </div>
  );
}
