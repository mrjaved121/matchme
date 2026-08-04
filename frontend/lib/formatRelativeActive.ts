// Coarse "Active Xm ago" label for the matches list — not meant to be
// precise, just a lightweight presence signal.
export function formatRelativeActive(lastActiveAt: string | null): string | null {
  if (!lastActiveAt) return null;

  const diffMs = Date.now() - new Date(lastActiveAt).getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 5) return "Active now";
  if (minutes < 60) return `Active ${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `Active ${days}d ago`;

  return null;
}

// Compact message timestamp for the matches list — "2m", "1h", "Yesterday",
// or a short date — matching design/stitch_just_spark_ui_kit/messages.
export function formatMessageTime(isoDate: string | null): string {
  if (!isoDate) return "";

  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d`;

  return new Date(isoDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
