const STYLES: Record<string, string> = {
  active: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  suspended: "bg-warning/10 text-warning",
  banned: "bg-error/10 text-error",
  pending: "bg-warning/10 text-warning",
  reviewed: "bg-foreground-secondary/10 text-foreground-secondary",
  actioned: "bg-success/10 text-success",
  dismissed: "bg-foreground-secondary/10 text-foreground-secondary",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        STYLES[status] ?? "bg-foreground-secondary/10 text-foreground-secondary"
      }`}
    >
      {status}
    </span>
  );
}
