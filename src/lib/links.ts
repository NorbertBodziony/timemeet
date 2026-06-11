// Public web origin for share links (universal links). With the app installed
// iOS/Android open these directly in the app; without it the browser shows the
// fallback page served by convex/http.ts (proxied behind meettime.pl).
export const WEB_ORIGIN = "https://meettime.pl";

export function webLink(path: string): string {
  return `${WEB_ORIGIN}${path}`;
}
