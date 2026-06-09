import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../providers/MockAuthProvider";
import { usePush } from "../providers/MockPushProvider";

// Real-time in-app notifications: watches the signed-in user's notification feed
// (a reactive Convex query) and pops a toast when a new one arrives — e.g. when
// another person RSVPs, a poll resolves, or an event is cancelled. Renders nothing.
export function NotificationListener() {
  const { currentUser } = useAuth();
  const { push } = usePush();
  const rows = useQuery(
    api.notifications.listForUser,
    currentUser ? { userId: currentUser._id, limit: 5 } : "skip"
  );
  // Baseline timestamp; only notifications created after it produce a toast.
  const watermark = useRef<number | null>(null);

  useEffect(() => {
    // Reset the baseline when the user changes (sign in / switch).
    watermark.current = null;
  }, [currentUser?._id]);

  useEffect(() => {
    if (!rows) return;
    const newest = rows[0]?._creationTime ?? 0;
    if (watermark.current === null) {
      watermark.current = newest; // first load — don't replay existing ones
      return;
    }
    const fresh = rows.filter((n) => n._creationTime > (watermark.current ?? 0));
    if (fresh.length > 0) {
      watermark.current = newest;
      push({ title: fresh[0].title });
    }
  }, [rows, push]);

  return null;
}
