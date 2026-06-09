import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

// Mocked auth (docs/meettime-mvp.md §12). Holds the current user and a dev
// "switch user" control. The app passes currentUser._id into every Convex call.
// When real auth lands, swap this for an identity → users lookup.

type MockAuth = {
  currentUser: Doc<"users"> | null;
  users: Doc<"users">[];
  isLoading: boolean;
  switchUser: (id: Id<"users">) => void;
  signOut: () => void;
};

const Ctx = createContext<MockAuth | null>(null);

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const users = useQuery(api.users.list);
  const [selectedId, setSelectedId] = useState<Id<"users"> | null>(null);

  const value = useMemo<MockAuth>(() => {
    const list = users ?? [];
    const current =
      list.find((u) => u._id === selectedId) ?? list[0] ?? null;
    return {
      currentUser: current,
      users: list,
      isLoading: users === undefined,
      switchUser: setSelectedId,
      signOut: () => setSelectedId(null),
    };
  }, [users, selectedId]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): MockAuth {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside MockAuthProvider");
  return ctx;
}

// Convenience: the current user id, or throw if not signed in. Use in screens
// that require a session before issuing a mutation.
export function useUserId(): Id<"users"> {
  const { currentUser } = useAuth();
  if (!currentUser) throw new Error("No mock user — seed the database first.");
  return currentUser._id;
}
