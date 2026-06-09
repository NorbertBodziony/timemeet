import { Linking, Platform } from "react-native";

// Open an address in the device's maps app — no in-app map, we fit into the
// user's existing tools (Apple Maps on iOS, Google Maps elsewhere).
export async function openMaps(address: string): Promise<void> {
  const q = encodeURIComponent(address.trim());
  if (!q) return;
  const url =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?q=${q}`
      : `https://www.google.com/maps/search/?api=1&query=${q}`;
  try {
    await Linking.openURL(url);
  } catch {
    // Fall back to the universal Google Maps web URL.
    await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`).catch(
      () => {}
    );
  }
}
