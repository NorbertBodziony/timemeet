import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { rsvpStatus } from "./schema";
import { requireUser } from "./helpers";
import { notify } from "./notifications";

// Set the current user's RSVP for an event (one row per event/user).
export const set = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    status: rsvpStatus,
  },
  handler: async (ctx, { userId, eventId, status }) => {
    const me = await requireUser(ctx, userId);
    const event = await ctx.db.get(eventId);
    if (!event) throw new ConvexError({ k: "errors.eventNotFound" });

    const all = await ctx.db
      .query("rsvps")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    const existing = all.find((r) => r.userId === userId) ?? null;
    const changedAt = Date.now();
    const wasGoing = existing?.status === "going";

    // Capacity: a "going" request beyond capacity becomes "waitlist".
    let effective = status;
    if (status === "going" && event.capacity) {
      const goingOthers = all.filter((r) => r.status === "going" && r.userId !== userId).length;
      if (goingOthers >= event.capacity) effective = "waitlist";
    }

    // Notify the organizer when someone newly commits to "going".
    if (effective === "going" && !wasGoing && event.creatorId !== userId) {
      await notify(ctx, [event.creatorId], "rsvp", "notif.rsvpGoing", { name: me.displayName, title: event.title }, eventId);
    }
    // Tell the user they landed on the waitlist.
    if (effective === "waitlist" && status === "going") {
      await notify(ctx, [userId], "rsvp", "notif.waitlisted", { title: event.title }, eventId);
    }

    const rsvpId = existing
      ? (await ctx.db.patch(existing._id, { status: effective, changedAt }), existing._id)
      : await ctx.db.insert("rsvps", { eventId, userId, status: effective, changedAt });

    // Auto-promote: if a going spot opened up, move the oldest waitlister in.
    if (wasGoing && effective !== "going" && event.capacity) {
      const goingNow = all.filter(
        (r) => r.status === "going" && r.userId !== userId
      ).length;
      if (goingNow < event.capacity) {
        const waitlist = all
          .filter((r) => r.status === "waitlist" && r.userId !== userId)
          .sort((a, b) => a.changedAt - b.changedAt);
        const next = waitlist[0];
        if (next) {
          await ctx.db.patch(next._id, { status: "going", changedAt });
          await notify(ctx, [next.userId], "rsvp", "notif.spotOpened", { title: event.title }, eventId);
        }
      }
    }
    return rsvpId;
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
