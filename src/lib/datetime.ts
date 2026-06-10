// Display formatting only. Convex stores epoch ms UTC (docs/meettime-mvp.md §13).
// Day/month names + clock style follow the active language (pl default).

import { getLang } from "./i18n";

const NAMES = {
  en: {
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
  pl: {
    days: ["niedz.", "pon.", "wt.", "śr.", "czw.", "pt.", "sob."],
    months: ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"],
  },
} as const;

function names() {
  return NAMES[getLang()];
}

function dayMonth(d: Date): string {
  // pl: "14 maj" · en: "May 14"
  return getLang() === "pl"
    ? `${d.getDate()} ${names().months[d.getMonth()]}`
    : `${names().months[d.getMonth()]} ${d.getDate()}`;
}

function clock(d: Date): string {
  const m = d.getMinutes();
  if (getLang() === "pl") {
    // Polish reads 24h.
    return `${d.getHours()}:${String(m).padStart(2, "0")}`;
  }
  let h = d.getHours();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return m === 0 ? `${h}${ampm}` : `${h}:${String(m).padStart(2, "0")}${ampm}`;
}

// e.g. "Wed, May 14, 6:00pm"
export function formatDateTime(ms: number): string {
  const d = new Date(ms);
  return `${names().days[d.getDay()]}, ${dayMonth(d)}, ${clock(d)}`;
}

// e.g. "Wed, May 14"
export function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${names().days[d.getDay()]}, ${dayMonth(d)}`;
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
