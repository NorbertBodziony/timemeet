import { Alert, Linking, Platform } from "react-native";

// Open an address in the user's maps app — no in-app map, we fit into existing
// tools. iOS asks which app (Apple Maps or Google Maps); Android goes straight
// to Google Maps. The Google URL is a universal link: it opens the Google Maps
// app when installed and the browser otherwise.
export async function openMaps(address: string): Promise<void> {
  const q = encodeURIComponent(address.trim());
  if (!q) return;
  const apple = `http://maps.apple.com/?q=${q}`;
  const google = `https://www.google.com/maps/search/?api=1&query=${q}`;
  const open = (url: string) => Linking.openURL(url).catch(() => {});

  if (Platform.OS !== "ios") {
    await open(google);
    return;
  }
  Alert.alert("Open in", address.trim(), [
    { text: "Apple Maps", onPress: () => open(apple) },
    { text: "Google Maps", onPress: () => open(google) },
    { text: "Cancel", style: "cancel" },
  ]);
}
