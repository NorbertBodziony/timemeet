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

// Plain helper used by other mutations to fan out notifications. Skips empty
// recipient sets and never notifies the actor (caller filters them out).
export async function notify(
  ctx: MutationCtx,
  recipients: Id<"users">[],
  type: NotifType,
  title: string,
  eventId?: Id<"events">
) {
  await Promise.all(
    [...new Set(recipients)].map(async (userId) => {
      await ctx.db.insert("notifications", { userId, type, title, eventId, read: false });
      // Real device push (if the user registered a token).
      const user = await ctx.db.get(userId);
      if (user?.pushToken) {
        await ctx.scheduler.runAfter(0, internal.push.sendExpo, {
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
