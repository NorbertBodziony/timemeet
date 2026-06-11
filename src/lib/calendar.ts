import { Linking } from "react-native";

type EventInput = {
  title: string;
  startsAt: number;
  endsAt?: number;
  location?: string;
  description?: string;
};

function endOf(event: EventInput): number {
  return event.endsAt ?? event.startsAt + 2 * 60 * 60 * 1000;
}

// UTC stamp for Google Calendar links: YYYYMMDDTHHMMSSZ.
function stamp(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// "Add to calendar" → Google Calendar template link — pure URL, opens the GCal
// app when installed and the web otherwise. No native module, works in every
// build. (Device-calendar option removed on tester request.)
export function addToCalendar(event: EventInput): Promise<void> {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${stamp(event.startsAt)}/${stamp(endOf(event))}`,
  });
  if (event.location) params.set("location", event.location);
  if (event.description) params.set("details", event.description);
  return Linking.openURL(
    `https://calendar.google.com/calendar/render?${params.toString()}`
  );
}
