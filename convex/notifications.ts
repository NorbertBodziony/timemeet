import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { requireUser } from "./helpers";

type NotifType =
  | "invite"
  | "poll_resolved"
  | "event_cancelled"
  | "rsvp"
  | "post"
  | "reminder";

// Map a notification type to the preference toggle that controls it. Types
// without a specific toggle (rsvp, post) are gated by the master switch only.
const PREF_KEY: Partial<
  Record<NotifType, "newInvite" | "pollResolved" | "eventCancelled" | "reminder2h" | "activity">
> = {
  invite: "newInvite",
  poll_resolved: "pollResolved",
  event_cancelled: "eventCancelled",
  reminder: "reminder2h",
  rsvp: "activity",
  post: "activity",
};

const HOUR_MS = 60 * 60 * 1000;
const WARSAW_OFFSET_MIN = 120; // fallback when the device never reported a tz

// Quiet hours 22:00–08:00 local: how long to hold a device push so it lands at
// 08:00 instead of buzzing at night. 0 = send now. Pure for easy reasoning.
export function quietDelayMs(nowMs: number, tzOffsetMinutes: number): number {
  const localMs = nowMs + tzOffsetMinutes * 60 * 1000;
  const local = new Date(localMs);
  const hour = local.getUTCHours();
  if (hour >= 8 && hour < 22) return 0;
  const eight = new Date(localMs);
  eight.setUTCHours(8, 0, 0, 0);
  let target = eight.getTime();
  if (hour >= 22) target += 24 * HOUR_MS; // tonight → tomorrow 08:00
  return target - localMs;
}

// Plain helper used by other mutations to fan out notifications. Skips empty
// recipient sets and never notifies the actor (caller filters them out).
// Respects each recipient's notificationPrefs (master + per-type); no prefs set
// → send everything.
export async function notify(
  ctx: MutationCtx,
  recipients: Id<"users">[],
  type: NotifType,
  title: string,
  eventId?: Id<"events">
) {
  await Promise.all(
    [...new Set(recipients)].map(async (userId) => {
      const user = await ctx.db.get(userId);
      const prefs = user?.notificationPrefs;
      if (prefs) {
        if (!prefs.master) return; // muted everything
        const key = PREF_KEY[type];
        if (key && prefs[key] === false) return; // muted this type
      }
      await ctx.db.insert("notifications", { userId, type, title, eventId, read: false });
      // Real device push (if the user registered a token). Quiet hours hold
      // non-critical pushes until 08:00 local — cancellations always go now.
      if (user?.pushToken) {
        const quietOn = prefs?.quietHours !== false;
        const delay =
          type === "event_cancelled" || !quietOn
            ? 0
            : quietDelayMs(Date.now(), user.tzOffsetMinutes ?? WARSAW_OFFSET_MIN);
        await ctx.scheduler.runAfter(delay, internal.push.sendExpo, {
          token: user.pushToken,
          title,
        });
      }
    })
  );
}

export const listForUser = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit }) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit ?? 30);
  },
});

export const unreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows.filter((n) => !n.read).length;
  },
});

export const markAllRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireUser(ctx, userId);
    const unread = (
      await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    ).filter((n) => !n.read);
    await Promise.all(unread.map((n) => ctx.db.patch(n._id, { read: true })));
  },
});
