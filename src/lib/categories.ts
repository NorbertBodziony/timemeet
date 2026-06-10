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
  labelKey: string; // i18n key
  emoji: string;
  icon: IconName;
};

export const CATEGORIES: Category[] = [
  { key: "coffee", labelKey: "cat.coffee", emoji: "☕", icon: "cafe-outline" },
  { key: "food", labelKey: "cat.food", emoji: "🍝", icon: "restaurant-outline" },
  { key: "drinks", labelKey: "cat.drinks", emoji: "🍻", icon: "beer-outline" },
  { key: "sport", labelKey: "cat.sport", emoji: "🏃", icon: "basketball-outline" },
  { key: "outdoors", labelKey: "cat.outdoors", emoji: "🌲", icon: "leaf-outline" },
  { key: "games", labelKey: "cat.games", emoji: "🎲", icon: "game-controller-outline" },
  { key: "culture", labelKey: "cat.culture", emoji: "🎭", icon: "color-palette-outline" },
  { key: "other", labelKey: "cat.other", emoji: "✨", icon: "sparkles-outline" },
];

const BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]));

export function categoryFor(keys: string[] | undefined): Category | null {
  if (!keys || keys.length === 0) return null;
  return BY_KEY.get(keys[0] as CategoryKey) ?? null;
}
