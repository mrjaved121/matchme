"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../lib/supabase/client";

type Config = {
  daily_like_limit: number;
  superlike_limit_free: number;
  superlike_limit_gold: number;
  gold_weekly_price_usd: number;
  gold_monthly_price_usd: number;
  gold_annual_price_usd: number;
};

export function AppConfigForm({ config }: { config: Config }) {
  const router = useRouter();
  const [form, setForm] = useState(config);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function setField(key: keyof Config, value: number) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("app_config").update(form).eq("id", true);
    setSaving(false);
    if (!error) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">Daily Limits</h2>
        <p className="mb-4 text-sm text-foreground-secondary">Enforced server-side in the swipe RPC.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumberField
            label="Free likes/day"
            value={form.daily_like_limit}
            onChange={(v) => setField("daily_like_limit", v)}
          />
          <NumberField
            label="Free super likes/day"
            value={form.superlike_limit_free}
            onChange={(v) => setField("superlike_limit_free", v)}
          />
          <NumberField
            label="Gold super likes/day"
            value={form.superlike_limit_gold}
            onChange={(v) => setField("superlike_limit_gold", v)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">Gold Pricing (display only)</h2>
        <p className="mb-4 text-sm text-foreground-secondary">
          No payment processor is connected yet — this only controls what price is shown on the paywall.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumberField
            label="Weekly ($)"
            step={0.01}
            value={form.gold_weekly_price_usd}
            onChange={(v) => setField("gold_weekly_price_usd", v)}
          />
          <NumberField
            label="Monthly ($)"
            step={0.01}
            value={form.gold_monthly_price_usd}
            onChange={(v) => setField("gold_monthly_price_usd", v)}
          />
          <NumberField
            label="Annual, per month ($)"
            step={0.01}
            value={form.gold_annual_price_usd}
            onChange={(v) => setField("gold_annual_price_usd", v)}
          />
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        {saved ? <span className="text-sm text-success">Saved</span> : null}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-foreground-secondary">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
      />
    </label>
  );
}
