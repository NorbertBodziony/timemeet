/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crews from "../crews.js";
import type * as events from "../events.js";
import type * as friends from "../friends.js";
import type * as helpers from "../helpers.js";
import type * as i18n from "../i18n.js";
import type * as invites from "../invites.js";
import type * as items from "../items.js";
import type * as notifications from "../notifications.js";
import type * as polls from "../polls.js";
import type * as posts from "../posts.js";
import type * as push from "../push.js";
import type * as ratings from "../ratings.js";
import type * as referrals from "../referrals.js";
import type * as reminders from "../reminders.js";
import type * as rsvps from "../rsvps.js";
import type * as seed from "../seed.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crews: typeof crews;
  events: typeof events;
  friends: typeof friends;
  helpers: typeof helpers;
  i18n: typeof i18n;
  invites: typeof invites;
  items: typeof items;
  notifications: typeof notifications;
  polls: typeof polls;
  posts: typeof posts;
  push: typeof push;
  ratings: typeof ratings;
  referrals: typeof referrals;
  reminders: typeof reminders;
  rsvps: typeof rsvps;
  seed: typeof seed;
  subscriptions: typeof subscriptions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
