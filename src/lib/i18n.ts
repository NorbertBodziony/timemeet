import { pl } from "./translations/pl";
import { en } from "./translations/en";

// Tiny i18n: two flat dictionaries, {param} interpolation, Polish default.
// Components use useT() from LanguageProvider; non-React code (datetime,
// ErrorBoundary) reads the module-level current language set by the provider.

export type Lang = "pl" | "en";
export const DEFAULT_LANG: Lang = "pl";

const DICTS: Record<Lang, Record<string, string>> = { pl, en };

let currentLang: Lang = DEFAULT_LANG;
export function setCurrentLang(lang: Lang) {
  currentLang = lang;
}
export function getLang(): Lang {
  return currentLang;
}

export function translate(
  lang: Lang,
  key: string,
  params?: Record<string, string | number>
): string {
  let s = DICTS[lang][key] ?? DICTS.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

// Convenience for non-hook contexts — uses the provider-synced current language.
export function t(key: string, params?: Record<string, string | number>): string {
  return translate(currentLang, key, params);
}
