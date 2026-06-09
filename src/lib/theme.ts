// RSVP metadata mapped onto HeroUI Native's default theme (no custom palette).
// See docs/meettime-mvp.md §16 — but colors now come from HeroUI semantics.

import type { Doc } from "../../convex/_generated/dataModel";

export type RsvpStatus = Doc<"rsvps">["status"];

// HeroUI Chip/Button colors: 'accent' | 'default' | 'success' | 'warning' | 'danger'.
// "Not going" stays neutral ('default') — never punishing (copy law), not danger-red.
export type HeroColor = "accent" | "default" | "success" | "warning" | "danger";

type RsvpMeta = { label: string; color: HeroColor; icon: string };

export const RSVP: Record<RsvpStatus, RsvpMeta> = {
  going: { label: "Going", color: "success", icon: "✓" },
  maybe: { label: "Maybe", color: "warning", icon: "?" },
  waitlist: { label: "Waitlist", color: "accent", icon: "⏱" },
  not_going: { label: "Not going", color: "default", icon: "✕" },
  no_response: { label: "No response", color: "default", icon: "…" },
};

// The 4 statuses a user can pick (no_response is the initial state, not an action).
export const RSVP_ACTIONS: RsvpStatus[] = [
  "going",
  "maybe",
  "waitlist",
  "not_going",
];
