import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireUser } from "./helpers";

// Rate a past meetup (1–5 stars, optional note). One rating per (event, user).
export const set = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    stars: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { userId, eventId, stars, note }) => {
    await requireUser(ctx, userId);
    if (stars < 1 || stars > 5) throw new ConvexError("Pick 1 to 5 stars.");
    const existing = await ctx.db
      .query("eventRatings")
      .withIndex("by_event_user", (q) =>
        q.eq("eventId", eventId).eq("userId", userId)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { stars, note: note?.trim() || undefined });
      return existing._id;
    }
    return await ctx.db.insert("eventRatings", {
      eventId,
      userId,
      stars,
      note: note?.trim() || undefined,
    });
  },
});

// Rating summary for an event: average, count, the viewer's rating, recent notes.
export const forEvent = query({
  args: { eventId: v.id("events"), userId: v.optional(v.id("users")) },
  handler: async (ctx, { eventId, userId }) => {
    const ratings = await ctx.db
      .query("eventRatings")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    const count = ratings.length;
    const average =
      count === 0
        ? 0
        : Math.round((ratings.reduce((s, r) => s + r.stars, 0) / count) * 10) / 10;
    const mine = userId
      ? ratings.find((r) => r.userId === userId) ?? null
      : null;
    const recent = (
      await Promise.all(
        ratings
          .filter((r) => r.note)
          .slice(-5)
          .map(async (r) => ({
            stars: r.stars,
            note: r.note,
            user: await ctx.db.get(r.userId),
          }))
      )
    ).reverse();
    return {
      average,
      count,
      mine: mine ? { stars: mine.stars, note: mine.note } : null,
      recent,
    };
  },
});
