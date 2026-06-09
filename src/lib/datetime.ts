// Display formatting only. Convex stores epoch ms UTC (docs/meettime-mvp.md §13).

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function clock(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return m === 0 ? `${h}${ampm}` : `${h}:${String(m).padStart(2, "0")}${ampm}`;
}

// e.g. "Wed, May 14, 6:00pm"
export function formatDateTime(ms: number): string {
  const d = new Date(ms);
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${clock(d)}`;
}

// e.g. "Wed, May 14"
export function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

// e.g. "6:00pm"
export function formatTime(ms: number): string {
  return clock(new Date(ms));
}

// "6:00pm–8:00pm" or just the start if no end.
export function formatRange(startMs: number, endMs?: number): string {
  return endMs ? `${clock(new Date(startMs))}–${clock(new Date(endMs))}` : clock(new Date(startMs));
}

// Short relative time, e.g. "now", "5m", "3h", "2d".
export function formatRelative(ms: number, now: number = Date.now()): string {
  const s = Math.max(0, Math.floor((now - ms) / 1000));
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
