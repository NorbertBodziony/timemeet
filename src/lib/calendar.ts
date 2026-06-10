import { Alert, Platform } from "react-native";
import * as Calendar from "expo-calendar";
import { success } from "./haptics";
import { shareIcs } from "./ics";

type EventInput = {
  title: string;
  startsAt: number;
  endsAt?: number;
  location?: string;
  description?: string;
};

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

// Add a meetup straight into the device calendar. Falls back to the .ics
// share sheet when permission is declined or no writable calendar exists —
// never a dead end.
export async function addToCalendar(event: EventInput): Promise<void> {
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
      endDate: new Date(event.endsAt ?? event.startsAt + 2 * 60 * 60 * 1000),
      location: event.location,
      notes: event.description,
    });
    success();
    Alert.alert("In your calendar 🎉", `${event.title} is saved.`);
  } catch {
    // Native write failed for any other reason — the share sheet still works.
    await shareIcs(event);
  }
}
