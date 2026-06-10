import { Alert, Linking, Platform } from "react-native";
import { t } from "./i18n";

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
  Alert.alert(t("maps.openIn"), address.trim(), [
    { text: t("maps.apple"), onPress: () => open(apple) },
    { text: t("maps.google"), onPress: () => open(google) },
    { text: t("maps.cancel"), style: "cancel" },
  ]);
}
