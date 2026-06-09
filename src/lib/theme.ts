// Design-system constants that can't live as Tailwind classes (gradients) +
// RSVP metadata. See docs/meettime-mvp.md §4 / §16.

import type { Doc } from "../../convex/_generated/dataModel";

export type RsvpStatus = Doc<"rsvps">["status"];

// 135° brand gradient for the primary CTA (rendered via expo-linear-gradient,
// NOT a Tailwind bg — the CSS shorthand renders it black/white).
export const BRAND_GRADIENT = ["#A3FF12", "#7ED600", "#5DA802"] as const;

export const COLOR = {
  canvas: "#FAFFF2",
  surface: "#FFFFFF",
  evergreen: "#0F1A00",
  fern: "#5DA802",
  textSecondary: "rgba(15,26,0,0.65)",
  border: "rgba(15,26,0,0.10)",
} as const;

type RsvpMeta = {
  label: string;
  color: string; // hex
  // "Not going" is never punishing — neutral gray in the friendly card, not red.
  friendlyColor: string;
  icon: string; // emoji stand-in (swap for Tabler icons later)
};

export const RSVP: Record<RsvpStatus, RsvpMeta> = {
  going: { label: "Going", color: "#5DA802", friendlyColor: "#5DA802", icon: "✓" },
  maybe: { label: "Maybe", color: "#F59E0B", friendlyColor: "#F59E0B", icon: "?" },
  waitlist: { label: "Waitlist", color: "#8B5CF6", friendlyColor: "#8B5CF6", icon: "⏱" },
  not_going: { label: "Not going", color: "#FF3D5A", friendlyColor: "#9CA3AF", icon: "✕" },
  no_response: { label: "No response", color: "#9CA3AF", friendlyColor: "#9CA3AF", icon: "…" },
};

// The 4 statuses a user can pick (no_response is the initial state, not an action).
export const RSVP_ACTIONS: RsvpStatus[] = [
  "going",
  "maybe",
  "waitlist",
  "not_going",
];
