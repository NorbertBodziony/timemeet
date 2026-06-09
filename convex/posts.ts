import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./helpers";

export const add = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    body: v.string(),
    isAnnouncement: v.boolean(),
  },
  handler: async (ctx, { userId, eventId, body, isAnnouncement }) => {
    await requireUser(ctx, userId);
    if (!body.trim()) throw new Error("Write something first.");
    return await ctx.db.insert("posts", {
      eventId,
      authorId: userId,
      body: body.trim(),
      isAnnouncement,
    });
  },
});

export const listForEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .order("desc")
      .collect();
    return Promise.all(
      posts.map(async (p) => ({ ...p, author: await ctx.db.get(p.authorId) }))
    );
  },
});
