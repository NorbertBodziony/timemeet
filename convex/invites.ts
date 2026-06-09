import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { DAY_MS, requireUser } from "./helpers";

// Mock share link — returns a token; the deeplink itself is faked in the app.
export const createToken = mutation({
  args: { userId: v.id("users"), eventId: v.id("events") },
  handler: async (ctx, { userId, eventId }) => {
    await requireUser(ctx, userId);
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error("Event not found.");
    const inviteToken = `inv_${Math.random().toString(36).slice(2, 10)}`;
    await ctx.db.insert("eventInvites", {
      eventId,
      inviteToken,
      expiresAt: Date.now() + 14 * DAY_MS,
    });
    return inviteToken;
  },
});

// Invite landing data. `now` passed in (queries can't read the clock).
export const resolve = query({
  args: { token: v.string(), now: v.number() },
  handler: async (ctx, { token, now }) => {
    const invite = await ctx.db
      .query("eventInvites")
      .withIndex("by_token", (q) => q.eq("inviteToken", token))
      .unique();
    if (!invite) return { status: "not_found" as const };
    if (invite.expiresAt < now) return { status: "expired" as const };
    const event = await ctx.db.get(invite.eventId);
    if (!event) return { status: "not_found" as const };
    const creator = await ctx.db.get(event.creatorId);
    const going = (
      await ctx.db
        .query("rsvps")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect()
    ).filter((r) => r.status === "going").length;
    return { status: "ok" as const, event, creator, going };
  },
});
