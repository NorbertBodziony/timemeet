import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import {
  DAY_MS,
  randomToken,
  requireEventParticipant,
  requireUser,
} from "./helpers";
import { notify } from "./notifications";

// Crews the user belongs to, each with its members (for avatars + counts).
export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const memberships = await ctx.db
      .query("crewMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const crews = await Promise.all(
      memberships.map(async (m) => {
        const crew = await ctx.db.get(m.crewId);
        if (!crew) return null;
        const members = await ctx.db
          .query("crewMembers")
          .withIndex("by_crew", (q) => q.eq("crewId", crew._id))
          .collect();
        const users = (
          await Promise.all(members.map((mm) => ctx.db.get(mm.userId)))
        ).filter((u): u is NonNullable<typeof u> => !!u);
        return { ...crew, members: users };
      })
    );
    return crews
      .filter((c): c is NonNullable<typeof c> => !!c)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Create a crew from a set of friends (creator is added as an owner member).
export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    memberIds: v.array(v.id("users")),
  },
  handler: async (ctx, { userId, name, memberIds }) => {
    await requireUser(ctx, userId);
    const title = name.trim();
    if (!title) throw new ConvexError("Give your crew a name first.");
    const crewId = await ctx.db.insert("crews", {
      name: title,
      createdBy: userId,
      privacy: "private",
    });
    const ids = [...new Set([userId, ...memberIds])];
    for (const id of ids) {
      await ctx.db.insert("crewMembers", {
        crewId,
        userId: id,
        role: id === userId ? "owner" : "member",
      });
    }
    return crewId;
  },
});

// Invite every crew member who isn't already on the guest list. Returns how
// many new people were added so the UI can confirm.
export const inviteToEvent = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    crewId: v.id("crews"),
  },
  handler: async (ctx, { userId, eventId, crewId }) => {
    const me = await requireUser(ctx, userId);
    // Must be part of the meetup to invite others to it…
    const event = await requireEventParticipant(
      ctx,
      userId,
      eventId,
      "Join this meetup before inviting your crew."
    );

    const members = await ctx.db
      .query("crewMembers")
      .withIndex("by_crew", (q) => q.eq("crewId", crewId))
      .collect();
    // …and a member of the crew you're inviting.
    if (!members.some((m) => m.userId === userId)) {
      throw new ConvexError("You're not in that crew.");
    }
    const rsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
    const onList = new Set(rsvps.map((r) => r.userId));

    const fresh = members
      .map((m) => m.userId)
      .filter((id) => id !== userId && !onList.has(id));

    for (const friendId of fresh) {
      await ctx.db.insert("rsvps", {
        eventId,
        userId: friendId,
        status: "no_response",
        changedAt: Date.now(),
      });
      await ctx.db.insert("eventInvites", {
        eventId,
        inviteeUserId: friendId,
        inviteToken: randomToken("inv"),
        expiresAt: Date.now() + 14 * DAY_MS,
      });
    }
    await notify(
      ctx,
      fresh,
      "invite",
      `${me.displayName} invited you to ${event.title}`,
      eventId
    );
    return { invited: fresh.length };
  },
});
