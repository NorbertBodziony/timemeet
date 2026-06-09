import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

// Mocked auth (docs/meettime-mvp.md §12). Holds the current user + an explicit
// signed-in flag (persisted across launches), so the app has a real logged-out
// state and doesn't reset to onboarding every cold start. The app passes
// currentUser._id into every Convex call. When real auth lands, swap this for an
// identity → users lookup.

const KEY_SIGNED_IN = "mt.signedIn";
const KEY_USER_ID = "mt.userId";

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
  const [hydrated, setHydrated] = useState(false);

  // Restore persisted session once on launch.
  useEffect(() => {
    (async () => {
      try {
        const [s, u] = await AsyncStorage.multiGet([KEY_SIGNED_IN, KEY_USER_ID]);
        if (s[1] === "1") setSignedIn(true);
        if (u[1]) setSelectedId(u[1] as Id<"users">);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const value = useMemo<MockAuth>(() => {
    const list = users ?? [];
    const current = signedIn
      ? list.find((u) => u._id === selectedId) ?? list[0] ?? null
      : null;
    return {
      currentUser: current,
      users: list,
      isLoading: users === undefined || !hydrated,
      isSignedIn: signedIn && !!current,
      signIn: (id) => {
        if (id) {
          setSelectedId(id);
          AsyncStorage.setItem(KEY_USER_ID, id);
        }
        setSignedIn(true);
        AsyncStorage.setItem(KEY_SIGNED_IN, "1");
      },
      switchUser: (id) => {
        setSelectedId(id);
        AsyncStorage.setItem(KEY_USER_ID, id);
      },
      signOut: () => {
        setSignedIn(false);
        setSelectedId(null);
        AsyncStorage.multiRemove([KEY_SIGNED_IN, KEY_USER_ID]);
      },
    };
  }, [users, signedIn, selectedId, hydrated]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): MockAuth {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside MockAuthProvider");
  return ctx;
}

export function useUserId(): Id<"users"> {
  const { currentUser } = useAuth();
  if (!currentUser) throw new Error("No mock user — sign in first.");
  return currentUser._id;
}
