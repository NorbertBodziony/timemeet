// Server-side mini-i18n: notification titles rendered per recipient language.
// Mirrors the notif.* keys in src/lib/translations. Polish is the default.

export type ServerLang = "pl" | "en";

const STRINGS: Record<ServerLang, Record<string, string>> = {
  pl: {
    "notif.rsvpGoing": "{name} idzie na {title}",
    "notif.waitlisted": "{title}: brak miejsc, jesteś na rezerwie.",
    "notif.spotOpened": "Zwolniło się miejsce! Wbijasz na {title}.",
    "notif.invitedYou": "{name} zaprasza cię na {title}",
    "notif.addedFriend": "{name} dodał(a) cię do znajomych",
    "notif.planSet": "Plan klepnięty! {title}",
    "notif.cancelled": "Odwołane: {title}",
    "notif.notEnough": "Za mało osób. {title} tym razem odpada.",
    "notif.post": "{name}: {body}",
    "notif.postPhoto": "{name} dodał(a) zdjęcie 📷",
    "notif.dayBefore": "Jutro: {title}",
    "notif.twoHours": "Za 2 godziny: {title} 👀",
    "notif.recap": "Jak było na {title}? Kliknij i oceń.",
    "notif.nudgeWaiting": "{name} czeka. Wbijasz na {title}?",
    "notif.nudgeTomorrow": "Jutro: {title}. Zdążysz jeszcze potwierdzić.",
  },
  en: {
    "notif.rsvpGoing": "{name} is going to {title}",
    "notif.waitlisted": "{title} is full, you're on the waitlist.",
    "notif.spotOpened": "A spot opened! You're in for {title}.",
    "notif.invitedYou": "{name} invited you to {title}",
    "notif.addedFriend": "{name} added you as a friend",
    "notif.planSet": "Plan's set! {title}",
    "notif.cancelled": "Cancelled: {title}",
    "notif.notEnough": "Not enough people. {title} is off this time.",
    "notif.post": "{name}: {body}",
    "notif.postPhoto": "{name} shared a photo 📷",
    "notif.dayBefore": "Tomorrow: {title}",
    "notif.twoHours": "In 2 hours: {title} 👀",
    "notif.recap": "How was {title}? Tap to rate.",
    "notif.nudgeWaiting": "{name} is waiting. You in for {title}?",
    "notif.nudgeTomorrow": "Tomorrow: {title}. Still time to say you're in.",
  },
};

export function render(
  lang: ServerLang | undefined,
  key: string,
  params?: Record<string, string>
): string {
  const l: ServerLang = lang ?? "pl";
  let s = STRINGS[l][key] ?? STRINGS.pl[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replaceAll(`{${k}}`, v);
    }
  }
  return s;
}
