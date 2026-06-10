import { Alert, Linking, Platform } from "react-native";
import * as Calendar from "expo-calendar";
import { success } from "./haptics";
import { t } from "./i18n";
import { shareIcs } from "./ics";

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

// Google Calendar template link — pure URL, opens the GCal app when installed
// and the web otherwise. No native module, works in every build.
function openGoogleCalendar(event: EventInput): Promise<void> {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${stamp(event.startsAt)}/${stamp(endOf(event))}`,
  });
  if (event.location) params.set("location", event.location);
  if (event.description) params.set("details", event.description);
  return Linking.openURL(
    `https://calendar.google.com/calendar/render?${params.toString()}`
  ).catch(() => {});
}

// Find a calendar we can write to (the system default on iOS; the first
// writable one on Android).
async function writableCalendarId(): Promise<string | null> {
  if (Platform.OS === "ios") {
    const def = await Calendar.getDefaultCalendarAsync().catch(() => null);
    if (def) return def.id;
  }
  const all = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return all.find((c) => c.allowsModifications)?.id ?? null;
}

// Write straight into the device calendar; falls back to the .ics share sheet
// when permission is declined or the native module isn't available.
async function addToDeviceCalendar(event: EventInput): Promise<void> {
  try {
    const perm = await Calendar.requestCalendarPermissionsAsync();
    if (!perm.granted) {
      await shareIcs(event);
      return;
    }
    const calendarId = await writableCalendarId();
    if (!calendarId) {
      await shareIcs(event);
      return;
    }
    await Calendar.createEventAsync(calendarId, {
      title: event.title,
      startDate: new Date(event.startsAt),
      endDate: new Date(endOf(event)),
      location: event.location,
      notes: event.description,
    });
    success();
    Alert.alert(t("event.inCalendar"), t("event.calendarSaved", { title: event.title }));
  } catch {
    await shareIcs(event);
  }
}

// "Add to calendar" — ask which calendar (testers asked for Google Calendar).
export async function addToCalendar(event: EventInput): Promise<void> {
  Alert.alert(t("calendar.addTo"), event.title, [
    { text: t("calendar.google"), onPress: () => void openGoogleCalendar(event) },
    { text: t("calendar.device"), onPress: () => void addToDeviceCalendar(event) },
    { text: t("calendar.cancel"), style: "cancel" },
  ]);
}
