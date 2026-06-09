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
        "eventRatings",
        "notifications",
        "eventInvites",
        "events",
        "subscriptions",
        "users",
        "referrals",
      ] as const) {
        for (const row of await ctx.db.query(table).collect()) {
          await ctx.db.delete(row._id);
        }
      }
    }

    const now = Date.now();
    // Clean times (top of the hour) so demo content reads nicely.
    const at = (days: number, hour: number) => {
      const d = new Date(now);
      d.setHours(hour, 0, 0, 0);
      return d.getTime() + days * DAY_MS;
    };
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
          startsAt: at(d, 19),
          endsAt: at(d, 22),
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
      startsAt: at(1, 17),
      endsAt: at(1, 19),
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
      startsAt: at(-5, 18),
      endsAt: at(-5, 20),
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
    // Ratings on the past event (so the recap + history show a real average).
    const ratingPlan: Array<[number, number, string | undefined]> = [
      [1, 5, "Best wall yet 🧗"],
      [2, 4, undefined],
    ];
    for (const [userIdx, stars, note] of ratingPlan) {
      await ctx.db.insert("eventRatings", {
        eventId: past,
        userId: crew[userIdx],
        stars,
        note,
      });
    }

    // A couple of notifications so Karolina's inbox isn't empty on first run.
    await ctx.db.insert("notifications", {
      userId: karolina,
      type: "rsvp",
      title: "Marek is going to Coffee at Karma ☕",
      eventId: upcoming,
      read: false,
    });
    await ctx.db.insert("notifications", {
      userId: karolina,
      type: "post",
      title: "Ania: bring chalk for the climb",
      eventId: past,
      read: true,
    });

    return { seeded: true, userId: karolina };
  },
});
