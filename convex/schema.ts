import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// MeetTime data model — see docs/meettime-mvp.md §6.
// Timestamps are epoch milliseconds (UTC). RSVP keeps all 5 statuses.

export const rsvpStatus = v.union(
  v.literal("going"),
  v.literal("maybe"),
  v.literal("waitlist"),
  v.literal("not_going"),
  v.literal("no_response")
);

export const voteValue = v.union(
  v.literal("yes"),
  v.literal("maybe"),
  v.literal("no")
);

export default defineSchema({
  users: defineTable({
    displayName: v.string(),
    email: v.optional(v.string()),
    city: v.string(), // default "Kraków"
    photoUrl: v.optional(v.string()),
    referralCode: v.string(), // MEETTIME-NAME-XXX
    authSubject: v.optional(v.string()), // null while auth is mocked
    // Notification prefs — mocked push (meettime-mvp.md §3.7). All default on.
    notificationPrefs: v.optional(
      v.object({
        master: v.boolean(),
        newInvite: v.boolean(),
        pollResolved: v.boolean(),
        eventCancelled: v.boolean(),
        reminder2h: v.boolean(),
      })
    ),
    analyticsOptIn: v.optional(v.boolean()), // opt-IN (RODO, §38)
    deletedAt: v.optional(v.number()), // soft delete; hard-delete cron is deferred
  }).index("by_authSubject", ["authSubject"]),

  polls: defineTable({
    creatorId: v.id("users"),
    type: v.union(
      v.literal("time"),
      v.literal("place"),
      v.literal("time_place")
    ),
    title: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("closed"),
      v.literal("converted")
    ),
    expiresAt: v.number(), // default +14d
    eventId: v.optional(v.id("events")),
  })
    .index("by_creator", ["creatorId"])
    .index("by_status", ["status"]),

  pollSlots: defineTable({
    pollId: v.id("polls"),
    startsAt: v.number(),
    endsAt: v.number(),
    position: v.number(),
  }).index("by_poll", ["pollId"]),

  pollPlaceOptions: defineTable({
    pollId: v.id("polls"),
    placeId: v.string(),
    name: v.string(),
    address: v.string(),
    lat: v.number(),
    lng: v.number(),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    partnerId: v.optional(v.id("partners")),
  }).index("by_poll", ["pollId"]),

  pollVotes: defineTable({
    pollId: v.id("polls"),
    userId: v.optional(v.id("users")), // nullable = guest voting
    guestName: v.optional(v.string()),
    slotId: v.optional(v.id("pollSlots")),
    placeOptionId: v.optional(v.id("pollPlaceOptions")),
    value: voteValue,
  })
    .index("by_poll", ["pollId"])
    .index("by_poll_user", ["pollId", "userId"]),

  events: defineTable({
    creatorId: v.id("users"),
    sourcePollId: v.optional(v.id("polls")),
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
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("cancelled"),
      v.literal("finished")
    ),
  })
    .index("by_creator", ["creatorId"])
    .index("by_status", ["status"])
    .index("by_startsAt", ["startsAt"]),

  eventInvites: defineTable({
    eventId: v.id("events"),
    inviteeUserId: v.optional(v.id("users")),
    inviteToken: v.string(),
    expiresAt: v.number(), // +14d
    usedAt: v.optional(v.number()),
  })
    .index("by_event", ["eventId"])
    .index("by_token", ["inviteToken"]),

  rsvps: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    status: rsvpStatus,
    changedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_event_user", ["eventId", "userId"])
    .index("by_user", ["userId"]),

  posts: defineTable({
    eventId: v.id("events"),
    authorId: v.id("users"),
    body: v.string(),
    isAnnouncement: v.boolean(),
  }).index("by_event", ["eventId"]),

  // In-app notifications — written on key events, read reactively by the app.
  notifications: defineTable({
    userId: v.id("users"), // recipient
    type: v.union(
      v.literal("invite"),
      v.literal("poll_resolved"),
      v.literal("event_cancelled"),
      v.literal("rsvp"),
      v.literal("post"),
      v.literal("reminder")
    ),
    title: v.string(),
    eventId: v.optional(v.id("events")),
    read: v.boolean(),
  }).index("by_user", ["userId"]),

  // Post-event ratings (1–5 stars) — one per (event, user).
  eventRatings: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    stars: v.number(),
    note: v.optional(v.string()),
  })
    .index("by_event", ["eventId"])
    .index("by_event_user", ["eventId", "userId"]),

  partners: defineTable({
    name: v.string(),
    placeId: v.string(),
    sportCardFlags: v.object({
      multisport: v.boolean(),
      medicover: v.boolean(),
      pzu: v.boolean(),
      okSystem: v.boolean(),
    }),
    placementPaidUntil: v.optional(v.number()),
    commissionTier: v.optional(v.number()),
  }).index("by_placeId", ["placeId"]),

  referrals: defineTable({
    referrerId: v.id("users"),
    refereeId: v.optional(v.id("users")),
    code: v.string(),
    activatedAt: v.optional(v.number()),
    rewardGrantedAt: v.optional(v.number()),
  })
    .index("by_code", ["code"])
    .index("by_referrer", ["referrerId"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    plan: v.union(
      v.literal("free"),
      v.literal("meettime_plus"),
      v.literal("founder")
    ),
    trialCountEvents: v.number(),
    status: v.string(),
    currentPeriodEnd: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  // M+1 — persistent crews (schema only for now)
  crews: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
    privacy: v.string(),
  }).index("by_creator", ["createdBy"]),

  crewMembers: defineTable({
    crewId: v.id("crews"),
    userId: v.id("users"),
    role: v.string(),
  })
    .index("by_crew", ["crewId"])
    .index("by_user", ["userId"]),
});
