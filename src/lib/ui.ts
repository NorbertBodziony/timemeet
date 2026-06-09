// Shared UI tokens — the few raw values that were duplicated inline across
// screens. Keep this tiny; everything else stays in Tailwind/HeroUI classes.

// Soft, barely-there elevation — the Apple way (no harsh shadows). Pair with
// `bg-surface` and NO border (border + shadow together reads heavy).
export const cardShadow = {
  shadowColor: "#1c1917",
  shadowOpacity: 0.05,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

// A slightly stronger lift for hero surfaces (e.g. the QR card).
export const cardShadowLifted = {
  shadowColor: "#1c1917",
  shadowOpacity: 0.08,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
} as const;

// Radii for the handful of inline-radius spots (RSVP pills, camera frame).
export const radius = { card: 16, tile: 12, pill: 999 } as const;

// Apple large titles use slight negative tracking — tightens big headings.
export const TITLE_TRACKING = -0.4;
