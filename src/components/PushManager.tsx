import { useEffect, useMemo } from "react";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../providers/MockAuthProvider";

// Show notifications while the app is foregrounded too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Device notifications:
//  - registers an Expo push token (real backgrounded push in a native build;
//    no-ops in Expo Go / simulator where there's no token)
//  - schedules LOCAL "2 hours before" reminders for upcoming events — these fire
//    on-device even when the app is closed, and work in Expo Go.
export function PushManager() {
  const { currentUser } = useAuth();
  const setToken = useMutation(api.users.setPushToken);
  const now = useMemo(() => Date.now(), []);
  const going = useQuery(
    api.events.listByTab,
    currentUser ? { userId: currentUser._id, tab: "going" as const, now } : "skip"
  );

  // Permissions + remote push token.
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        let { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted") {
          status = (await Notifications.requestPermissionsAsync()).status;
        }
        if (status !== "granted" || !Device.isDevice) return;
        const projectId =
          (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
            ?.projectId ?? Constants.easConfig?.projectId;
        const token = (
          await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
        ).data;
        if (token)
          await setToken({
            userId: currentUser._id,
            token,
            // Device offset from UTC, for server-side quiet hours (22–8 local).
            tzOffsetMinutes: -new Date().getTimezoneOffset(),
          });
      } catch {
        // Expo Go / simulator: remote token unavailable — local reminders still work.
      }
    })();
  }, [currentUser?._id, setToken]);

  // Local 2h-before reminders for the user's confirmed events.
  useEffect(() => {
    if (!going) return;
    (async () => {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        for (const row of going) {
          const fireAt = row.event.startsAt - 2 * 60 * 60 * 1000;
          if (fireAt > Date.now()) {
            await Notifications.scheduleNotificationAsync({
              content: { title: "MeetTime", body: `In 2 hours — ${row.event.title} 👀` },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: new Date(fireAt),
              },
            });
          }
        }
      } catch {
        // ignore — notifications are best-effort
      }
    })();
  }, [going]);

  return null;
}
