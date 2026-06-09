import { internalAction } from "./_generated/server";
import { v } from "convex/values";

// Send a single Expo push message. Scheduled from notify() for recipients that
// have registered a device token. Fires real, backgrounded notifications in a
// native build; in Expo Go / simulator there's usually no token, so this no-ops.
export const sendExpo = internalAction({
  args: { token: v.string(), title: v.string() },
  handler: async (_ctx, { token, title }) => {
    try {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          to: token,
          title: "MeetTime",
          body: title,
          sound: "default",
        }),
      });
    } catch {
      // best-effort; a failed push must never break the originating mutation
    }
  },
});
