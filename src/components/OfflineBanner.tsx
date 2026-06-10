import { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConvexConnectionState } from "convex/react";
import { Text } from "heroui-native";
import { useT } from "../providers/LanguageProvider";

// Slim banner when the Convex websocket drops. Debounced so it never flashes
// during normal app launch / brief blips.
export function OfflineBanner() {
  const { t } = useT();
  const state = useConvexConnectionState();
  const insets = useSafeAreaInsets();
  const [show, setShow] = useState(false);

  const connected = state.isWebSocketConnected;
  useEffect(() => {
    if (connected) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(t);
  }, [connected]);

  if (!show) return null;
  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 items-center"
      style={{ top: insets.top + 4, zIndex: 50 }}
    >
      <View className="bg-foreground rounded-full px-4 py-1.5 opacity-90">
        <Text type="body-xs" weight="semibold" className="text-background">
          {t("offline.banner")}
        </Text>
      </View>
    </View>
  );
}
