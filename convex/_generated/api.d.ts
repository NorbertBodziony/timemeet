/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * Hand-authored stand-in for `npx convex dev` output (no network in this env).
 * Types are derived from the actual module exports, so they stay accurate;
 * Convex regenerates this file identically when run on a networked machine.
 */
import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as events from "../events.js";
import type * as helpers from "../helpers.js";
import type * as invites from "../invites.js";
import type * as polls from "../polls.js";
import type * as posts from "../posts.js";
import type * as referrals from "../referrals.js";
import type * as rsvps from "../rsvps.js";
import type * as seed from "../seed.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";

declare const fullApi: ApiFromModules<{
  events: typeof events;
  helpers: typeof helpers;
  invites: typeof invites;
  polls: typeof polls;
  posts: typeof posts;
  referrals: typeof referrals;
  rsvps: typeof rsvps;
  seed: typeof seed;
  subscriptions: typeof subscriptions;
  users: typeof users;
}>;

export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
