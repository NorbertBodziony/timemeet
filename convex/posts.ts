import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./helpers";
import { notify } from "./notifications";

export const add = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    body: v.string(),
    isAnnouncement: v.boolean(),
  },
  handler: async (ctx, { userId, eventId, body, isAnnouncement }) => {
    const me = await requireUser(ctx, userId);
    const text = body.trim();
    if (!text) throw new Error("Write something first.");
    const postId = await ctx.db.insert("posts", {
      eventId,
      authorId: userId,
      body: text,
      isAnnouncement,
    });

    // Announcements ping everyone who responded (except the author).
    if (isAnnouncement) {
      const rsvps = await ctx.db
        .query("rsvps")
        .withIndex("by_event", (q) => q.eq("eventId", eventId))
        .collect();
      await notify(
        ctx,
        rsvps.map((r) => r.userId).filter((id) => id !== userId),
        "post",
        `${me.displayName}: ${text.slice(0, 60)}`,
        eventId
      );
    }
    return postId;
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
