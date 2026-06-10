// Curated PL city list for the profile picker. Swap for Google Places
// autocomplete once an API key exists (mock law — no external accounts in MVP);
// the picker already supports free-text entry, so the seam is just the source.
export const CITIES: string[] = [
  "Warszawa",
  "Kraków",
  "Wrocław",
  "Poznań",
  "Gdańsk",
  "Łódź",
  "Szczecin",
  "Katowice",
  "Lublin",
  "Białystok",
  "Bydgoszcz",
  "Gdynia",
  "Częstochowa",
  "Radom",
  "Toruń",
  "Rzeszów",
  "Sosnowiec",
  "Kielce",
  "Gliwice",
  "Olsztyn",
];

// Case/diacritic-insensitive prefix-ish match ("krak" → Kraków).
export function searchCities(query: string): string[] {
  const q = fold(query.trim());
  if (!q) return CITIES;
  return CITIES.filter((c) => fold(c).includes(q));
}

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l");
}
