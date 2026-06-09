import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./helpers";

const planValidator = v.union(
  v.literal("free"),
  v.literal("meettime_plus"),
  v.literal("founder")
);

// Current plan (Settings → Subscription). Defaults to a free row view if none.
export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return (
      sub ?? {
        userId,
        plan: "free" as const,
        trialCountEvents: 0,
        status: "active",
      }
    );
  },
});

// Mock upgrade/downgrade — no Stripe/Apple/Google/BLIK (meettime-mvp.md §7/§37).
export const setPlan = mutation({
  args: { userId: v.id("users"), plan: planValidator },
  handler: async (ctx, { userId, plan }) => {
    await requireUser(ctx, userId);
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { plan, status: "active" });
      return existing._id;
    }
    return await ctx.db.insert("subscriptions", {
      userId,
      plan,
      trialCountEvents: 0,
      status: "active",
    });
  },
});
