import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  DAY_MS,
  randomToken,
  requireEventParticipant,
  requireUser,
} from "./helpers";
import { notify } from "./notifications";

// Resolve a public friend code (the QR payload) to a small user preview, so the
// "Add friend?" screen can show who you're about to add.
export const resolveCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", code.trim()))
      .unique();
    if (!user || user.deletedAt) return null;
    return { _id: user._id, displayName: user.displayName, city: user.city };
  },
});

// Add a friend by scanning their QR / entering their code. Mutual + idempotent.
export const addByCode = mutation({
  args: { userId: v.id("users"), code: v.string() },
  handler: async (ctx, { userId, code }) => {
    const me = await requireUser(ctx, userId);
    const target = await ctx.db
      .query("users")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", code.trim()))
      .unique();
    if (!target || target.deletedAt) throw new Error("That code didn't match anyone.");
    if (target._id === userId) throw new Error("That's your own code 🙂");

    const already = await ctx.db
      .query("friends")
      .withIndex("by_pair", (q) =>
        q.eq("userId", userId).eq("friendId", target._id)
      )
      .unique();
    if (!already) {
      await ctx.db.insert("friends", { userId, friendId: target._id });
      await ctx.db.insert("friends", { userId: target._id, friendId: userId });
      await notify(ctx, [target._id], "invite", `${me.displayName} added you as a friend`);
    }
    return {
      alreadyFriends: !!already,
      friend: { _id: target._id, displayName: target.displayName },
    };
  },
});

// A user's friend list (accepted edges). Returns the friend user docs.
export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const edges = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const friends = await Promise.all(edges.map((e) => ctx.db.get(e.friendId)));
    return friends
      .filter((u): u is NonNullable<typeof u> => !!u && !u.deletedAt)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});

// Friends annotated with where they stand for a given event, so the invite
// sheet can show "Going" / "Invited" instead of an invite button.
export const listForInvite = query({
  args: { userId: v.id("users"), eventId: v.id("events") },
  handler: async (ctx, { userId, eventId }) => {
    const edges = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const rsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    const rsvpByUser = new Map(rsvps.map((r) => [r.userId, r.status]));

    const rows = await Promise.all(
      edges.map(async (e) => {
        const friend = await ctx.db.get(e.friendId);
        if (!friend || friend.deletedAt) return null;
        const status = rsvpByUser.get(e.friendId);
        // "invited" = on the guest list but not yet replied.
        const state =
          status === "going" || status === "maybe"
            ? status
            : status // no_response / waitlist / not_going
              ? "invited"
              : "none";
        return { friend, state } as const;
      })
    );
    return rows
      .filter((r): r is NonNullable<typeof r> => !!r)
      .sort((a, b) => a.friend.displayName.localeCompare(b.friend.displayName));
  },
});

// Invite a friend to an event: add them to the guest list (no_response RSVP so
// it lands in their "to confirm" tab), record an invite, and notify them.
export const inviteFriend = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    friendId: v.id("users"),
  },
  handler: async (ctx, { userId, eventId, friendId }) => {
    const me = await requireUser(ctx, userId);
    const event = await requireEventParticipant(
      ctx,
      userId,
      eventId,
      "Join this meetup before inviting friends."
    );
    const friend = await ctx.db.get(friendId);
    if (!friend) throw new Error("That friend isn't around anymore.");

    // Skip if they're already on the guest list.
    const existing = (
      await ctx.db
        .query("rsvps")
        .withIndex("by_event_user", (q) =>
          q.eq("eventId", eventId).eq("userId", friendId)
        )
        .collect()
    )[0];
    if (!existing) {
      await ctx.db.insert("rsvps", {
        eventId,
        userId: friendId,
        status: "no_response",
        changedAt: Date.now(),
      });
    }

    await ctx.db.insert("eventInvites", {
      eventId,
      inviteeUserId: friendId,
      inviteToken: randomToken("inv"),
      expiresAt: Date.now() + 14 * DAY_MS,
    });

    await notify(
      ctx,
      [friendId],
      "invite",
      `${me.displayName} invited you to ${event.title}`,
      eventId
    );
    return { invited: true };
  },
});
