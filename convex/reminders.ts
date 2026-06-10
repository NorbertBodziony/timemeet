import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { notify } from "./notifications";

const HOUR = 60 * 60 * 1000;

const reminderKind = v.union(
  v.literal("day_before"),
  v.literal("two_hours"),
  v.literal("recap"),
  v.literal("nudge_unanswered"),
  v.literal("nudge_day_before")
);
type ReminderKind =
  | "day_before"
  | "two_hours"
  | "recap"
  | "nudge_unanswered"
  | "nudge_day_before";

// Schedule a meetup's reminder + threshold jobs. Only future times are queued.
// Called from events.create and polls.convertToEvent.
export async function scheduleEventJobs(
  ctx: MutationCtx,
  eventId: Id<"events">,
  startsAt: number,
  endsAt: number | undefined,
  minThreshold?: number
) {
  const now = Date.now();
  const queue = async (at: number, kind: ReminderKind) => {
    if (at > now) await ctx.scheduler.runAt(at, internal.reminders.send, { eventId, kind });
  };
  await queue(startsAt - 24 * HOUR, "day_before");
  await queue(startsAt - 2 * HOUR, "two_hours");
  await queue((endsAt ?? startsAt + 2 * HOUR) + 12 * HOUR, "recap");
  // Nudges for the undecided (spec K): 24h after creation if they still
  // haven't answered (only when it can't collide with the day-before nudge),
  // and 24h before for everyone still on the fence.
  if (startsAt > now + 26 * HOUR) await queue(now + 24 * HOUR, "nudge_unanswered");
  await queue(startsAt - 24 * HOUR, "nudge_day_before");
  if (minThreshold && minThreshold > 0 && startsAt - 2 * HOUR > now) {
    await ctx.scheduler.runAt(startsAt - 2 * HOUR, internal.reminders.thresholdCheck, { eventId });
  }
}

async function runSend(ctx: MutationCtx, eventId: Id<"events">, kind: ReminderKind) {
  const event = await ctx.db.get(eventId);
  if (!event || event.status === "cancelled") return;
  const rsvps = await ctx.db
    .query("rsvps")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect();
  const byStatus = (...statuses: Array<(typeof rsvps)[number]["status"]>) =>
    rsvps.filter((r) => statuses.includes(r.status)).map((r) => r.userId);

  let recipients: Id<"users">[];
  let title: string;
  if (kind === "day_before") {
    // Confirmed folks get the plain reminder; the undecided get the nudge below.
    recipients = byStatus("going");
    title = `Tomorrow — ${event.title}`;
  } else if (kind === "two_hours") {
    recipients = byStatus("going", "maybe");
    title = `In 2 hours — ${event.title} 👀`;
  } else if (kind === "nudge_unanswered") {
    if (event.startsAt < Date.now()) return;
    const organizer = await ctx.db.get(event.creatorId);
    recipients = byStatus("no_response");
    title = `${organizer?.displayName ?? "Your crew"} is waiting — you in for ${event.title}?`;
  } else if (kind === "nudge_day_before") {
    recipients = byStatus("no_response", "maybe");
    title = `Tomorrow — ${event.title}. Still time to say you're in.`;
  } else {
    recipients = byStatus("going");
    title = `How was ${event.title}? Tap to rate.`;
  }
  await notify(ctx, recipients, "reminder", title, eventId);
}

async function runThresholdCheck(ctx: MutationCtx, eventId: Id<"events">) {
  const event = await ctx.db.get(eventId);
  if (!event || event.status !== "published" || !event.minThreshold) return;
  const rsvps = await ctx.db
    .query("rsvps")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect();
  const going = rsvps.filter((r) => r.status === "going").length;
  if (going < event.minThreshold) {
    await ctx.db.patch(eventId, { status: "cancelled" });
    await notify(
      ctx,
      rsvps.map((r) => r.userId),
      "event_cancelled",
      `Not enough people — ${event.title} is off this time.`,
      eventId
    );
  }
}

export const send = internalMutation({
  args: { eventId: v.id("events"), kind: reminderKind },
  handler: (ctx, { eventId, kind }) => runSend(ctx, eventId, kind),
});

export const thresholdCheck = internalMutation({
  args: { eventId: v.id("events") },
  handler: (ctx, { eventId }) => runThresholdCheck(ctx, eventId),
});

// Internal trigger for tests/demos (fire a reminder now). Not client-callable —
// invoke with `npx convex run reminders:trigger '{...}'`.
export const trigger = internalMutation({
  args: { eventId: v.id("events"), kind: reminderKind },
  handler: (ctx, { eventId, kind }) => runSend(ctx, eventId, kind),
});
