import type { IconName } from "./icons";

// Predefined meetup categories (events.category stores the keys). One curated
// list so creation + discovery + cards all speak the same language.
export type CategoryKey =
  | "coffee"
  | "food"
  | "drinks"
  | "sport"
  | "outdoors"
  | "games"
  | "culture"
  | "other";

export type Category = {
  key: CategoryKey;
  label: string;
  emoji: string;
  icon: IconName;
};

export const CATEGORIES: Category[] = [
  { key: "coffee", label: "Coffee", emoji: "☕", icon: "cafe-outline" },
  { key: "food", label: "Food", emoji: "🍝", icon: "restaurant-outline" },
  { key: "drinks", label: "Drinks", emoji: "🍻", icon: "beer-outline" },
  { key: "sport", label: "Sport", emoji: "🏃", icon: "basketball-outline" },
  { key: "outdoors", label: "Outdoors", emoji: "🌲", icon: "leaf-outline" },
  { key: "games", label: "Games", emoji: "🎲", icon: "game-controller-outline" },
  { key: "culture", label: "Culture", emoji: "🎭", icon: "color-palette-outline" },
  { key: "other", label: "Other", emoji: "✨", icon: "sparkles-outline" },
];

const BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]));

export function categoryFor(keys: string[] | undefined): Category | null {
  if (!keys || keys.length === 0) return null;
  return BY_KEY.get(keys[0] as CategoryKey) ?? null;
}
