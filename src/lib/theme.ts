// MeetTime brand system (brand sheet §03–04). The 5 RSVP statuses carry their
// own functional palette — app-only, never marketing. Single source here.

import type { Ionicons } from "@expo/vector-icons";
import type { Doc } from "../../convex/_generated/dataModel";

export type RsvpStatus = Doc<"rsvps">["status"];

type RsvpMeta = {
  label: string;
  ion: keyof typeof Ionicons.glyphMap;
};

export const RSVP: Record<RsvpStatus, RsvpMeta> = {
  going: { label: "Going", ion: "checkmark-circle" },
  maybe: { label: "Maybe", ion: "help-circle" },
  waitlist: { label: "Waitlist", ion: "time" },
  not_going: { label: "Not going", ion: "close-circle" },
  no_response: { label: "No response", ion: "ellipsis-horizontal-circle" },
};

// §03 — RSVP status colors. fill = the status color; soft/softFg = its tinted
// chip treatment. Copy law still holds: the COLOR may be cherry, the WORDS are
// never punishing.
export const RSVP_COLORS: Record<
  RsvpStatus,
  { fill: string; soft: string; softFg: string }
> = {
  going: { fill: "#5DA802", soft: "#EAF6DC", softFg: "#3D6B02" }, // Bright Fern
  maybe: { fill: "#F59E0B", soft: "#FEF3C7", softFg: "#92600A" }, // Amber
  waitlist: { fill: "#8B5CF6", soft: "#EDE9FE", softFg: "#6D28D9" }, // Violet
  not_going: { fill: "#FF3D5A", soft: "#FFE4E9", softFg: "#C81E3F" }, // Cherry
  no_response: { fill: "#9CA3AF", soft: "#F3F4F6", softFg: "#6B7280" }, // Gray
};

// §04 — brand gradients (135° ⇒ start {0,0} → end {1,1}; 180° ⇒ top → bottom).
export const GRADIENTS = {
  bright: {
    colors: ["#A3FF12", "#7ED600", "#5DA802"] as const,
    locations: [0, 0.45, 1] as const,
  }, // Primary CTA
  deep: { colors: ["#4A8500", "#1A2B00"] as const }, // Premium tier
  stripe: { colors: ["#A3FF12", "#5DA802"] as const }, // Today card, 180°
};

// The 4 statuses a user can pick (no_response is the initial state, not an action).
export const RSVP_ACTIONS: RsvpStatus[] = [
  "going",
  "maybe",
  "waitlist",
  "not_going",
];
