import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

// Real local Convex. `npx convex dev` writes EXPO_PUBLIC_CONVEX_URL to .env.local;
// the local backend defaults to http://127.0.0.1:3210 when running.
const url =
  process.env.EXPO_PUBLIC_CONVEX_URL ?? "http://127.0.0.1:3210";

const client = new ConvexReactClient(url, {
  unsavedChangesWarning: false,
});

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
