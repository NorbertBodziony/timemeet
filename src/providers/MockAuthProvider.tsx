import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

// Mocked auth (docs/meettime-mvp.md §12). Holds the current user + an explicit
// signed-in flag so the app has a real logged-out state (login screen). OAuth
// buttons call signIn(); the app passes currentUser._id into every Convex call.
// When real auth lands, swap this for an identity → users lookup.

type MockAuth = {
  currentUser: Doc<"users"> | null;
  users: Doc<"users">[];
  isLoading: boolean;
  isSignedIn: boolean;
  signIn: (id?: Id<"users">) => void;
  switchUser: (id: Id<"users">) => void;
  signOut: () => void;
};

const Ctx = createContext<MockAuth | null>(null);

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const users = useQuery(api.users.list);
  const [signedIn, setSignedIn] = useState(false);
  const [selectedId, setSelectedId] = useState<Id<"users"> | null>(null);

  const value = useMemo<MockAuth>(() => {
    const list = users ?? [];
    const current = signedIn
      ? list.find((u) => u._id === selectedId) ?? list[0] ?? null
      : null;
    return {
      currentUser: current,
      users: list,
      isLoading: users === undefined,
      isSignedIn: signedIn && !!current,
      signIn: (id) => {
        if (id) setSelectedId(id);
        setSignedIn(true);
      },
      switchUser: (id) => setSelectedId(id),
      signOut: () => {
        setSignedIn(false);
        setSelectedId(null);
      },
    };
  }, [users, signedIn, selectedId]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): MockAuth {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside MockAuthProvider");
  return ctx;
}

// Convenience: the current user id, or throw if not signed in.
export function useUserId(): Id<"users"> {
  const { currentUser } = useAuth();
  if (!currentUser) throw new Error("No mock user — sign in first.");
  return currentUser._id;
}
