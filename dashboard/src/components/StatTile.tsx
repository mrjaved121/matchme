export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-sm text-foreground-secondary">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
