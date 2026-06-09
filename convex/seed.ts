import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { DAY_MS } from "./helpers";

// Dev seed — current user "Karolina" + a small crew, one sample Time Poll
// (mid-vote), one upcoming event (mixed RSVPs), one past event (history).
// Idempotent: no-op if users already exist (pass force:true to reseed).
export const run = mutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, { force }) => {
    const existing = await ctx.db.query("users").collect();
    if (existing.length > 0 && !force) {
      return { seeded: false, userId: existing[0]._id };
    }
    if (force) {
      // Wipe everything for a clean reseed.
      for (const table of [
        "pollVotes",
        "pollSlots",
        "pollPlaceOptions",
        "polls",
        "rsvps",
        "posts",
        "eventInvites",
        "events",
        "subscriptions",
        "users",
      ] as const) {
        for (const row of await ctx.db.query(table).collect()) {
          await ctx.db.delete(row._id);
        }
      }
    }

    const now = Date.now();
    const mk = (name: string, code: string) =>
      ctx.db.insert("users", {
        displayName: name,
        city: "Kraków",
        referralCode: `MEETTIME-${code}-${Math.random()
          .toString(36)
          .slice(2, 5)
          .toUpperCase()}`,
      });

    const karolina = await mk("Karolina", "KAROLINA");
    const marek = await mk("Marek", "MAREK");
    const ania = await mk("Ania", "ANIA");
    const tomek = await mk("Tomek", "TOMEK");
    const crew = [karolina, marek, ania, tomek];

    await ctx.db.insert("subscriptions", {
      userId: karolina,
      plan: "free",
      trialCountEvents: 0,
      status: "active",
    });

    // Sample Time Poll, mid-vote.
    const poll = await ctx.db.insert("polls", {
      creatorId: karolina,
      type: "time",
      title: "Board game night 🎲",
      status: "active",
      expiresAt: now + 14 * DAY_MS,
    });
    const slotDays = [2, 4, 6];
    const slots = await Promise.all(
      slotDays.map((d, i) =>
        ctx.db.insert("pollSlots", {
          pollId: poll,
          startsAt: now + d * DAY_MS + 19 * 60 * 60 * 1000,
          endsAt: now + d * DAY_MS + 22 * 60 * 60 * 1000,
          position: i,
        })
      )
    );
    // A few votes so the aggregate isn't empty.
    const votePlan: Array<[number, number, "yes" | "maybe" | "no"]> = [
      [0, 1, "yes"],
      [0, 2, "yes"],
      [1, 0, "maybe"],
      [2, 1, "no"],
      [1, 3, "yes"],
    ];
    for (const [slotIdx, userIdx, value] of votePlan) {
      await ctx.db.insert("pollVotes", {
        pollId: poll,
        userId: crew[userIdx],
        slotId: slots[slotIdx],
        value,
      });
    }

    // Upcoming event with mixed RSVPs.
    const upcoming = await ctx.db.insert("events", {
      creatorId: karolina,
      title: "Coffee at Karma ☕",
      startsAt: now + 1 * DAY_MS + 17 * 60 * 60 * 1000,
      endsAt: now + 1 * DAY_MS + 19 * 60 * 60 * 1000,
      customAddress: "Krupnicza 12, Kraków",
      category: ["cafe"],
      visibility: "invite_only",
      waitlistEnabled: false,
      status: "published",
    });
    const upcomingRsvps: Array<[number, "going" | "maybe" | "not_going" | "no_response"]> =
      [
        [0, "going"],
        [1, "going"],
        [2, "maybe"],
        [3, "no_response"],
      ];
    for (const [userIdx, status] of upcomingRsvps) {
      await ctx.db.insert("rsvps", {
        eventId: upcoming,
        userId: crew[userIdx],
        status,
        changedAt: now,
      });
    }

    // Past event for History.
    const past = await ctx.db.insert("events", {
      creatorId: karolina,
      title: "Climbing at Avatar 🧗",
      startsAt: now - 5 * DAY_MS,
      endsAt: now - 5 * DAY_MS + 2 * 60 * 60 * 1000,
      customAddress: "Mogilska 109, Kraków",
      category: ["sport"],
      visibility: "invite_only",
      waitlistEnabled: false,
      status: "finished",
    });
    for (const u of [karolina, marek, ania]) {
      await ctx.db.insert("rsvps", {
        eventId: past,
        userId: u,
        status: "going",
        changedAt: now - 6 * DAY_MS,
      });
    }

    return { seeded: true, userId: karolina };
  },
});
