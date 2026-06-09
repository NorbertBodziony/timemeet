import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "heroui-native";

// Mocked push (docs/meettime-mvp.md §7). Same payload shape as a real push, so
// swapping to Expo Notifications later is mechanical. Renders an in-app banner
// + console.log instead of a system notification.

export type PushPayload = { title: string; joy?: boolean };

type PushApi = { push: (payload: PushPayload) => void };
const Ctx = createContext<PushApi | null>(null);

export function MockPushProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [banner, setBanner] = useState<PushPayload | null>(null);

  const push = useCallback((payload: PushPayload) => {
    // eslint-disable-next-line no-console
    console.log("[mockPush]", payload.title);
    setBanner(payload);
    setTimeout(() => setBanner(null), 3000);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      {banner && (
        <Animated.View
          entering={FadeInUp}
          exiting={FadeOutUp}
          pointerEvents="none"
          style={{ position: "absolute", top: insets.top + 8, left: 16, right: 16 }}
        >
          <View className="rounded-2xl bg-foreground px-4 py-3">
            <Text weight="semibold" className="text-background">
              {banner.joy ? "🎉 " : ""}
              {banner.title}
            </Text>
          </View>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

export function usePush(): PushApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePush must be used inside MockPushProvider");
  return ctx;
}
