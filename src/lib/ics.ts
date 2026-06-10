import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

// Format a timestamp as an iCalendar UTC stamp: YYYYMMDDTHHMMSSZ.
function stamp(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Escape per RFC 5545 (commas, semicolons, newlines).
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/[,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
}

// Build a single-event .ics file and hand it to the OS share sheet — the
// fallback path when direct calendar access is declined/unavailable.
export async function shareIcs(event: {
  title: string;
  startsAt: number;
  endsAt?: number;
  location?: string;
  description?: string;
}): Promise<void> {
  const end = event.endsAt ?? event.startsAt + 2 * 60 * 60 * 1000;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MeetTime//EN",
    "BEGIN:VEVENT",
    `UID:${stamp(event.startsAt)}-${Math.abs(hash(event.title))}@meettime`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(event.startsAt)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(event.title)}`,
    event.location ? `LOCATION:${esc(event.location)}` : "",
    event.description ? `DESCRIPTION:${esc(event.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  const file = new File(Paths.cache, "meettime-event.ics");
  if (file.exists) file.delete();
  file.create();
  file.write(lines.join("\r\n"));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/calendar",
      UTI: "com.apple.ical.ics",
      dialogTitle: "Add to calendar",
    });
  }
}

// Tiny stable hash for a unique-enough UID.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
