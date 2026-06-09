import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { voteValue } from "./schema";
import { DAY_MS, requireUser } from "./helpers";
import { notify } from "./notifications";
import { scheduleEventJobs } from "./reminders";
import type { Id } from "./_generated/dataModel";

// Create a Time Poll (3–7 slots). Place polls share the same shape via placeOptions.
export const create = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("time"),
      v.literal("place"),
      v.literal("time_place")
    ),
    title: v.string(),
    slots: v.optional(
      v.array(v.object({ startsAt: v.number(), endsAt: v.number() }))
    ),
    placeOptions: v.optional(
      v.array(
        v.object({
          placeId: v.string(),
          name: v.string(),
          address: v.string(),
          lat: v.number(),
          lng: v.number(),
          rating: v.optional(v.number()),
          reviewCount: v.optional(v.number()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.userId);
    const title = args.title.trim();
    if (title.length < 1 || title.length > 100) {
      throw new Error("Title must be 1–100 characters.");
    }
    const slots = args.slots ?? [];
    if (args.type !== "place") {
      if (slots.length < 3 || slots.length > 7) {
        throw new Error("Add between 3 and 7 time slots.");
      }
    }

    const pollId = await ctx.db.insert("polls", {
      creatorId: args.userId,
      type: args.type,
      title,
      status: "active",
      expiresAt: Date.now() + 14 * DAY_MS,
    });

    await Promise.all(
      slots.map((s, i) =>
        ctx.db.insert("pollSlots", {
          pollId,
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          position: i,
        })
      )
    );
    await Promise.all(
      (args.placeOptions ?? []).map((p) =>
        ctx.db.insert("pollPlaceOptions", { pollId, ...p })
      )
    );
    return pollId;
  },
});

export const get = query({
  args: { pollId: v.id("polls"), userId: v.optional(v.id("users")) },
  handler: async (ctx, { pollId, userId }) => {
    const poll = await ctx.db.get(pollId);
    if (!poll) return null;
    const [slots, placeOptions, creator] = await Promise.all([
      ctx.db
        .query("pollSlots")
        .withIndex("by_poll", (q) => q.eq("pollId", pollId))
        .collect(),
      ctx.db
        .query("pollPlaceOptions")
        .withIndex("by_poll", (q) => q.eq("pollId", pollId))
        .collect(),
      ctx.db.get(poll.creatorId),
    ]);
    slots.sort((a, b) => a.position - b.position);

    // The viewer's own votes, keyed by slot/place id → value.
    const myVotes: Record<string, "yes" | "maybe" | "no"> = {};
    if (userId) {
      const mine = await ctx.db
        .query("pollVotes")
        .withIndex("by_poll_user", (q) =>
          q.eq("pollId", pollId).eq("userId", userId)
        )
        .collect();
      for (const vt of mine) {
        const key = (vt.slotId ?? vt.placeOptionId ?? "") as string;
        if (key) myVotes[key] = vt.value;
      }
    }
    return { poll, slots, placeOptions, creator, myVotes };
  },
});

export const listMine = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("polls")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .order("desc")
      .collect();
  },
});

// Upsert a vote per (poll, user, slot/place). One row per option per user.
export const vote = mutation({
  args: {
    userId: v.id("users"),
    pollId: v.id("polls"),
    slotId: v.optional(v.id("pollSlots")),
    placeOptionId: v.optional(v.id("pollPlaceOptions")),
    value: voteValue,
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.userId);
    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("Poll not found.");
    if (poll.status !== "active") throw new Error("This poll is closed.");

    const existing = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll_user", (q) =>
        q.eq("pollId", args.pollId).eq("userId", args.userId)
      )
      .collect();
    const match = existing.find(
      (e) =>
        (args.slotId && e.slotId === args.slotId) ||
        (args.placeOptionId && e.placeOptionId === args.placeOptionId)
    );
    if (match) {
      await ctx.db.patch(match._id, { value: args.value });
      return match._id;
    }
    return await ctx.db.insert("pollVotes", {
      pollId: args.pollId,
      userId: args.userId,
      slotId: args.slotId,
      placeOptionId: args.placeOptionId,
      value: args.value,
    });
  },
});

// Per-slot yes/maybe/no counts for the organizer view.
export const aggregate = query({
  args: { pollId: v.id("polls") },
  handler: async (ctx, { pollId }) => {
    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll", (q) => q.eq("pollId", pollId))
      .collect();
    const counts: Record<string, { yes: number; maybe: number; no: number }> =
      {};
    for (const vt of votes) {
      const key = (vt.slotId ?? vt.placeOptionId ?? "") as string;
      if (!key) continue;
      counts[key] ??= { yes: 0, maybe: 0, no: 0 };
      counts[key][vt.value] += 1;
    }
    return counts;
  },
});

// Winning slot → event with auto-RSVP (yes→going, maybe→maybe) for its voters.
export const convertToEvent = mutation({
  args: {
    userId: v.id("users"),
    pollId: v.id("polls"),
    winningSlotId: v.id("pollSlots"),
    placeId: v.optional(v.string()),
    customAddress: v.optional(v.string()),
    category: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.userId);
    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("Poll not found.");
    if (poll.creatorId !== args.userId) {
      throw new Error("Only the organizer can convert this poll.");
    }
    const slot = await ctx.db.get(args.winningSlotId);
    if (!slot || slot.pollId !== args.pollId) {
      throw new Error("Pick a valid winning slot.");
    }

    const eventId = await ctx.db.insert("events", {
      creatorId: args.userId,
      sourcePollId: args.pollId,
      title: poll.title,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      placeId: args.placeId,
      customAddress: args.customAddress,
      category: args.category ?? [],
      visibility: "invite_only",
      waitlistEnabled: false,
      status: "published",
    });

    // Auto-RSVP voters on the winning slot.
    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();
    const now = Date.now();
    const seen = new Set<string>();
    for (const vt of votes) {
      if (vt.slotId !== args.winningSlotId || !vt.userId) continue;
      if (vt.value === "no") continue;
      const uid = vt.userId as Id<"users">;
      if (seen.has(uid)) continue;
      seen.add(uid);
      await ctx.db.insert("rsvps", {
        eventId,
        userId: uid,
        status: vt.value === "yes" ? "going" : "maybe",
        changedAt: now,
      });
    }

    await ctx.db.patch(args.pollId, { status: "converted", eventId });
    await scheduleEventJobs(ctx, eventId, slot.startsAt, slot.endsAt);

    // Notify everyone auto-RSVP'd (except the organizer who converted).
    await notify(
      ctx,
      [...seen].filter((id) => id !== args.userId) as Id<"users">[],
      "poll_resolved",
      `Plan's set! ${poll.title}`,
      eventId
    );
    return eventId;
  },
});
