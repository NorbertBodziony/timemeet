import type { Ionicons } from "@expo/vector-icons";

// Named Ionicons used as UI chrome (not content). Keeps glyph names in one place.
type IonName = keyof typeof Ionicons.glyphMap;

export const ICONS = {
  // Tabs (outline / filled when focused)
  toConfirm: "mail-unread-outline",
  toConfirmActive: "mail-unread",
  going: "checkmark-circle-outline",
  goingActive: "checkmark-circle",
  history: "time-outline",
  historyActive: "time",
  mine: "calendar-outline",
  mineActive: "calendar",
  // Chrome
  settings: "settings-outline",
  chevron: "chevron-forward",
  add: "add",
  check: "checkmark",
  share: "share-outline",
  edit: "create-outline",
  trash: "trash-outline",
  send: "arrow-up-circle",
  // Meta
  date: "calendar-outline",
  time: "time-outline",
  place: "location-outline",
  people: "people-outline",
  person: "person-outline",
  star: "star",
  card: "card-outline",
  gift: "gift-outline",
  bell: "notifications-outline",
  lock: "lock-closed-outline",
  logout: "log-out-outline",
} satisfies Record<string, IonName>;

export type IconName = IonName;
