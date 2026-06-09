// Mock venue catalog for Place Polls (real Places API is out of MVP scope —
// docs §3.2). Ratings/Multisport badges are mocked data.
export type MockPlace = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  multisport?: boolean;
};

export const MOCK_PLACES: MockPlace[] = [
  { placeId: "karma", name: "Karma Coffee", address: "Krupnicza 12, Kraków", lat: 50.063, lng: 19.929, rating: 4.6, reviewCount: 820 },
  { placeId: "avatar", name: "Avatar Climbing", address: "Mogilska 109, Kraków", lat: 50.071, lng: 19.97, rating: 4.8, reviewCount: 540, multisport: true },
  { placeId: "forum", name: "Forum Przestrzenie", address: "Konopnickiej 28, Kraków", lat: 50.046, lng: 19.937, rating: 4.4, reviewCount: 3100 },
  { placeId: "hevre", name: "Hevre", address: "Meiselsa 18, Kraków", lat: 50.052, lng: 19.944, rating: 4.5, reviewCount: 1900 },
  { placeId: "bania", name: "Bania Luka Bowling", address: "Ślusarska 9, Kraków", lat: 50.045, lng: 19.953, rating: 4.3, reviewCount: 410, multisport: true },
  { placeId: "eszeweria", name: "Eszeweria", address: "Józefa 9, Kraków", lat: 50.051, lng: 19.946, rating: 4.6, reviewCount: 1500 },
];
