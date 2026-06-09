import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireEventParticipant, requireUser } from "./helpers";

// Bring-list for an event, each item with who (if anyone) has claimed it.
export const listForEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const items = await ctx.db
      .query("eventItems")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    return Promise.all(
      items.map(async (i) => ({
        ...i,
        claimer: i.claimedBy ? await ctx.db.get(i.claimedBy) : null,
      }))
    );
  },
});

// Add a thing to bring. The creator claims it by default (they suggested it).
export const add = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    title: v.string(),
  },
  handler: async (ctx, { userId, eventId, title }) => {
    await requireEventParticipant(ctx, userId, eventId, "Join this meetup to add to the list.");
    const text = title.trim();
    if (!text) throw new ConvexError("Name the thing first.");
    return ctx.db.insert("eventItems", {
      eventId,
      title: text,
      createdBy: userId,
      claimedBy: userId,
    });
  },
});

// Claim an open item, or release one you claimed (toggle).
export const toggleClaim = mutation({
  args: { userId: v.id("users"), itemId: v.id("eventItems") },
  handler: async (ctx, { userId, itemId }) => {
    await requireUser(ctx, userId);
    const item = await ctx.db.get(itemId);
    if (!item) throw new ConvexError("That item is gone.");
    await requireEventParticipant(ctx, userId, item.eventId, "Join this meetup to claim items.");
    // Only the claimer can release it; you can't take one already taken.
    if (item.claimedBy && item.claimedBy !== userId) {
      throw new ConvexError("Someone's already bringing that.");
    }
    await ctx.db.patch(itemId, { claimedBy: item.claimedBy === userId ? undefined : userId });
  },
});

// Remove an item — only the person who added it can.
export const remove = mutation({
  args: { userId: v.id("users"), itemId: v.id("eventItems") },
  handler: async (ctx, { userId, itemId }) => {
    await requireUser(ctx, userId);
    const item = await ctx.db.get(itemId);
    if (!item) return;
    if (item.createdBy !== userId) throw new ConvexError("Only the person who added it can remove it.");
    await ctx.db.delete(itemId);
  },
});
