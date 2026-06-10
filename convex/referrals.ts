import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireUser } from "./helpers";

// My referral code + how many I've brought in (Settings → Referrals, §27).
export const myStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", userId))
      .collect();
    return {
      code: user?.referralCode ?? "",
      total: referrals.length,
      activated: referrals.filter((r) => r.activatedAt).length,
    };
  },
});

// "Referred by" — record the code that invited this user (onboarding/settings).
export const setReferredBy = mutation({
  args: { userId: v.id("users"), code: v.string() },
  handler: async (ctx, { userId, code }) => {
    await requireUser(ctx, userId);
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) throw new ConvexError({ k: "errors.enterCode" });
    const referrer = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("referralCode"), trimmed))
      .first();
    if (!referrer) throw new ConvexError({ k: "errors.codeNoMatch" });
    if (referrer._id === userId) throw new ConvexError({ k: "errors.ownReferral" });
    await ctx.db.insert("referrals", {
      referrerId: referrer._id,
      refereeId: userId,
      code: trimmed,
      // Reward activates after the referee's first RSVP (anti-gaming, §27).
    });
  },
});
