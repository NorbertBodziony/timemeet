import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireUser } from "./helpers";

const DEFAULT_PREFS = {
  master: true,
  newInvite: true,
  pollResolved: true,
  eventCancelled: true,
  reminder2h: true,
  activity: true,
  quietHours: true,
};

// List active (non-deleted) users — backs the dev "switch user" control.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.filter((u) => !u.deletedAt);
  },
});

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

// Edit profile fields (Settings → Profile).
export const update = mutation({
  args: {
    userId: v.id("users"),
    patch: v.object({
      displayName: v.optional(v.string()),
      city: v.optional(v.string()),
      photoUrl: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { userId, patch }) => {
    const me = await requireUser(ctx, userId);
    if (patch.displayName !== undefined && !patch.displayName.trim()) {
      throw new ConvexError({ k: "errors.nameEmpty" });
    }
    // The referral code embeds the first name — regenerate it on rename so the
    // QR / shared code matches who you are now. Old shared codes stop working.
    if (patch.displayName && patch.displayName.trim() !== me.displayName) {
      const code = patch.displayName.trim().split(" ")[0]?.toUpperCase() || "FRIEND";
      await ctx.db.patch(userId, {
        ...patch,
        referralCode: `MEETTIME-${code}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      });
      return;
    }
    await ctx.db.patch(userId, patch);
  },
});

// Set the profile photo from an uploaded storage file (Settings → Profile).
export const setPhoto = mutation({
  args: { userId: v.id("users"), storageId: v.id("_storage") },
  handler: async (ctx, { userId, storageId }) => {
    await requireUser(ctx, userId);
    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new ConvexError({ k: "errors.photoUpload" });
    await ctx.db.patch(userId, { photoUrl: url });
  },
});

// UI/notification language (Settings → Language). Polish-first product.
export const setLanguage = mutation({
  args: { userId: v.id("users"), language: v.union(v.literal("pl"), v.literal("en")) },
  handler: async (ctx, { userId, language }) => {
    await requireUser(ctx, userId);
    await ctx.db.patch(userId, { language });
  },
});

// Notification preferences (Settings → Notifications). Returns effective prefs.
export const notificationPrefs = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    return user?.notificationPrefs ?? DEFAULT_PREFS;
  },
});

export const setNotificationPrefs = mutation({
  args: {
    userId: v.id("users"),
    prefs: v.object({
      master: v.boolean(),
      newInvite: v.boolean(),
      pollResolved: v.boolean(),
      eventCancelled: v.boolean(),
      reminder2h: v.boolean(),
      activity: v.optional(v.boolean()),
      quietHours: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { userId, prefs }) => {
    await requireUser(ctx, userId);
    await ctx.db.patch(userId, { notificationPrefs: prefs });
  },
});

export const setAnalyticsOptIn = mutation({
  args: { userId: v.id("users"), value: v.boolean() },
  handler: async (ctx, { userId, value }) => {
    await requireUser(ctx, userId);
    await ctx.db.patch(userId, { analyticsOptIn: value });
  },
});

// Store the device's Expo push token for real (backgrounded) push.
export const setPushToken = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    tzOffsetMinutes: v.optional(v.number()),
  },
  handler: async (ctx, { userId, token, tzOffsetMinutes }) => {
    await requireUser(ctx, userId);
    await ctx.db.patch(userId, { pushToken: token, tzOffsetMinutes });
  },
});

// Real-auth seam (docs §12): find-or-create a user by OAuth subject. Mock auth
// doesn't use this yet; a real provider (Apple/Google) calls it after sign-in.
export const upsertFromAuth = mutation({
  args: {
    authSubject: v.string(),
    displayName: v.string(),
    email: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, { authSubject, displayName, email, photoUrl }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_authSubject", (q) => q.eq("authSubject", authSubject))
      .unique();
    if (existing) {
      if (existing.deletedAt) await ctx.db.patch(existing._id, { deletedAt: undefined });
      return existing._id;
    }
    const code = displayName.split(" ")[0]?.toUpperCase() || "FRIEND";
    return await ctx.db.insert("users", {
      displayName,
      email,
      photoUrl,
      city: "Kraków",
      authSubject,
      referralCode: `MEETTIME-${code}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    });
  },
});

// Delete account (Settings → Privacy). Soft delete + 30-day grace (RODO, §38).
// Real hard-delete cron is deferred for this MVP slice.
export const deleteAccount = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireUser(ctx, userId);
    await ctx.db.patch(userId, { deletedAt: Date.now() });
  },
});
