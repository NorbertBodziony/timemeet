import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native";
import type { JSX } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ScopedTheme } from "uniwind";

import "../global.css";

export default function RootLayout(): JSX.Element {
  return (
    // ScopedTheme locks the whole app to the light/white theme, ignoring the
    // OS appearance (works in Expo Go and native builds alike).
    <ScopedTheme theme="light">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <HeroUINativeProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </HeroUINativeProvider>
      </GestureHandlerRootView>
    </ScopedTheme>
  );
}
