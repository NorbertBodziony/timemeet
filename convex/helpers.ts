import { ConvexError } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// Mocked auth → no ctx.auth identity. Every identity-scoped function takes an
// explicit userId and validates it here (docs/meettime-mvp.md §12). When real
// auth lands, replace this with an identity → users lookup.
export async function requireUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Doc<"users">> {
  const user = await ctx.db.get(userId);
  if (!user) throw new ConvexError("Unknown user — sign in again.");
  return user;
}

export const DAY_MS = 24 * 60 * 60 * 1000;

// A user "belongs to" an event if they created it or are on its guest list
// (have an RSVP row). Used to gate actions like inviting others, adding to the
// bring-list, or claiming items — you have to be part of the meetup first.
export async function requireEventParticipant(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  eventId: Id<"events">,
  blockedMsg = "Join this meetup first."
): Promise<Doc<"events">> {
  const event = await ctx.db.get(eventId);
  if (!event) throw new ConvexError("Event not found.");
  if (event.creatorId === userId) return event;
  const rsvp = await ctx.db
    .query("rsvps")
    .withIndex("by_event_user", (q) =>
      q.eq("eventId", eventId).eq("userId", userId)
    )
    .unique();
  if (!rsvp) throw new ConvexError(blockedMsg);
  return event;
}

// Cryptographically-strong, URL-safe token (~144 bits of entropy). Used for
// invite tokens that gate event access — must not be guessable. The Convex
// runtime provides Web Crypto's global `crypto` and `btoa`.
export function randomToken(prefix: string): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const b64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${prefix}_${b64}`;
}
