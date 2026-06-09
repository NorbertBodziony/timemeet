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
  if (!user) throw new Error("Unknown user — sign in again.");
  return user;
}

export const DAY_MS = 24 * 60 * 60 * 1000;
