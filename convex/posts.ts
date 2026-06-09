import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./helpers";
import { notify } from "./notifications";

// A short-lived URL the client uploads an image to before creating the post.
export const generateUploadUrl = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireUser(ctx, userId);
    return ctx.storage.generateUploadUrl();
  },
});

export const add = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    body: v.string(),
    isAnnouncement: v.boolean(),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { userId, eventId, body, isAnnouncement, imageId }) => {
    const me = await requireUser(ctx, userId);
    const text = body.trim();
    if (!text && !imageId) throw new Error("Write something or add a photo first.");
    const postId = await ctx.db.insert("posts", {
      eventId,
      authorId: userId,
      body: text,
      isAnnouncement,
      imageId,
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
        `${me.displayName}: ${text.slice(0, 60) || "shared a photo 📷"}`,
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
      posts.map(async (p) => ({
        ...p,
        author: await ctx.db.get(p.authorId),
        imageUrl: p.imageId ? await ctx.storage.getUrl(p.imageId) : null,
      }))
    );
  },
});
