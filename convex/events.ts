import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./helpers";
import type { Doc, Id } from "./_generated/dataModel";

const eventFields = {
  title: v.string(),
  startsAt: v.number(),
  endsAt: v.optional(v.number()),
  placeId: v.optional(v.string()),
  customAddress: v.optional(v.string()),
  category: v.array(v.string()),
  visibility: v.union(v.literal("invite_only"), v.literal("open")),
  capacity: v.optional(v.number()),
  waitlistEnabled: v.boolean(),
  minThreshold: v.optional(v.number()),
  description: v.optional(v.string()),
};

export const create = mutation({
  args: { userId: v.id("users"), ...eventFields },
  handler: async (ctx, args) => {
    const { userId, ...fields } = args;
    await requireUser(ctx, userId);
    if (fields.title.trim().length < 1 || fields.title.length > 100) {
      throw new Error("Title must be 1–100 characters.");
    }
    const eventId = await ctx.db.insert("events", {
      creatorId: userId,
      ...fields,
      status: "published",
    });
    // Organizer is going by default.
    await ctx.db.insert("rsvps", {
      eventId,
      userId,
      status: "going",
      changedAt: Date.now(),
    });
    return eventId;
  },
});

export const edit = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    patch: v.object({
      title: v.optional(v.string()),
      startsAt: v.optional(v.number()),
      endsAt: v.optional(v.number()),
      placeId: v.optional(v.string()),
      customAddress: v.optional(v.string()),
      category: v.optional(v.array(v.string())),
      capacity: v.optional(v.number()),
      description: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { userId, eventId, patch }) => {
    await requireUser(ctx, userId);
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error("Event not found.");
    if (event.creatorId !== userId) {
      throw new Error("Only the organizer can edit this event.");
    }
    await ctx.db.patch(eventId, patch);
  },
});

export const cancel = mutation({
  args: { userId: v.id("users"), eventId: v.id("events") },
  handler: async (ctx, { userId, eventId }) => {
    await requireUser(ctx, userId);
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error("Event not found.");
    if (event.creatorId !== userId) {
      throw new Error("Only the organizer can cancel this event.");
    }
    await ctx.db.patch(eventId, { status: "cancelled" });
  },
});

async function countByStatus(ctx: any, eventId: Id<"events">) {
  const rsvps = await ctx.db
    .query("rsvps")
    .withIndex("by_event", (q: any) => q.eq("eventId", eventId))
    .collect();
  const counts = {
    going: 0,
    maybe: 0,
    waitlist: 0,
    not_going: 0,
    no_response: 0,
  };
  for (const r of rsvps as Doc<"rsvps">[]) counts[r.status] += 1;
  return counts;
}

export const get = query({
  args: { eventId: v.id("events"), userId: v.optional(v.id("users")) },
  handler: async (ctx, { eventId, userId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) return null;
    const [creator, counts] = await Promise.all([
      ctx.db.get(event.creatorId),
      countByStatus(ctx, eventId),
    ]);
    let viewerStatus: Doc<"rsvps">["status"] | null = null;
    if (userId) {
      const mine = await ctx.db
        .query("rsvps")
        .withIndex("by_event_user", (q) =>
          q.eq("eventId", eventId).eq("userId", userId)
        )
        .unique();
      viewerStatus = mine?.status ?? null;
    }
    return { event, creator, counts, viewerStatus };
  },
});

// Drives the 4 Discovery tabs. `now` is passed in (queries can't read the clock).
export const listByTab = query({
  args: {
    userId: v.id("users"),
    tab: v.union(
      v.literal("to_confirm"),
      v.literal("going"),
      v.literal("history"),
      v.literal("mine")
    ),
    now: v.number(),
  },
  handler: async (ctx, { userId, tab, now }) => {
    const decorate = async (events: Doc<"events">[]) =>
      Promise.all(
        events.map(async (event) => ({
          event,
          counts: await countByStatus(ctx, event._id),
        }))
      );

    if (tab === "mine") {
      const events = await ctx.db
        .query("events")
        .withIndex("by_creator", (q) => q.eq("creatorId", userId))
        .order("desc")
        .collect();
      return decorate(events.filter((e) => e.status !== "cancelled"));
    }

    const myRsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const byEvent = new Map<Id<"events">, Doc<"rsvps">["status"]>();
    for (const r of myRsvps) byEvent.set(r.eventId, r.status);

    const loaded = (
      await Promise.all([...byEvent.keys()].map((id) => ctx.db.get(id)))
    ).filter((e): e is Doc<"events"> => !!e && e.status !== "cancelled");

    let filtered: Doc<"events">[];
    if (tab === "going") {
      filtered = loaded
        .filter((e) => byEvent.get(e._id) === "going" && e.startsAt >= now)
        .sort((a, b) => a.startsAt - b.startsAt);
    } else if (tab === "to_confirm") {
      filtered = loaded
        .filter((e) => byEvent.get(e._id) === "no_response" && e.startsAt >= now)
        .sort((a, b) => a.startsAt - b.startsAt);
    } else {
      // history — anything in the past the user was part of
      filtered = loaded
        .filter((e) => e.startsAt < now)
        .sort((a, b) => b.startsAt - a.startsAt);
    }
    return decorate(filtered);
  },
});
