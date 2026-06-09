import { query } from "./_generated/server";
import { v } from "convex/values";

// List all (mock) users — backs the dev "switch user" control.
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});
