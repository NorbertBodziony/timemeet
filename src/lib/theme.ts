// RSVP metadata mapped onto HeroUI Native's default theme (no custom palette).
// See docs/meettime-mvp.md §16 — but colors now come from HeroUI semantics.

import type { Ionicons } from "@expo/vector-icons";
import type { Doc } from "../../convex/_generated/dataModel";

export type RsvpStatus = Doc<"rsvps">["status"];

// HeroUI Chip/Button colors: 'accent' | 'default' | 'success' | 'warning' | 'danger'.
// "Not going" stays neutral ('default') — never punishing (copy law), not danger-red.
export type HeroColor = "accent" | "default" | "success" | "warning" | "danger";

type RsvpMeta = {
  label: string;
  color: HeroColor;
  ion: keyof typeof Ionicons.glyphMap;
};

export const RSVP: Record<RsvpStatus, RsvpMeta> = {
  going: { label: "Going", color: "success", ion: "checkmark-circle" },
  maybe: { label: "Maybe", color: "warning", ion: "help-circle" },
  waitlist: { label: "Waitlist", color: "accent", ion: "time" },
  not_going: { label: "Not going", color: "default", ion: "close-circle" },
  no_response: { label: "No response", color: "default", ion: "ellipsis-horizontal-circle" },
};

// The 4 statuses a user can pick (no_response is the initial state, not an action).
export const RSVP_ACTIONS: RsvpStatus[] = [
  "going",
  "maybe",
  "waitlist",
  "not_going",
];
