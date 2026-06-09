import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { rsvpStatus } from "./schema";
import { requireUser } from "./helpers";

// Set the current user's RSVP for an event (one row per event/user).
export const set = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    status: rsvpStatus,
  },
  handler: async (ctx, { userId, eventId, status }) => {
    await requireUser(ctx, userId);
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error("Event not found.");

    const existing = await ctx.db
      .query("rsvps")
      .withIndex("by_event_user", (q) =>
        q.eq("eventId", eventId).eq("userId", userId)
      )
      .unique();
    const changedAt = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { status, changedAt });
      return existing._id;
    }
    return await ctx.db.insert("rsvps", { eventId, userId, status, changedAt });
  },
});

export const listForEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const rsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    const withUsers = await Promise.all(
      rsvps.map(async (r) => ({ ...r, user: await ctx.db.get(r.userId) }))
    );
    return withUsers;
  },
});
