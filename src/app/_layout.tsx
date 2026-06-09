import { Ionicons } from "@expo/vector-icons";
import {
  Lato_400Regular,
  Lato_700Bold,
  Lato_900Black,
  useFonts,
} from "@expo-google-fonts/lato";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native";
import type { JSX } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ScopedTheme } from "uniwind";

import { CelebrationProvider } from "../providers/CelebrationProvider";
import { ConvexClientProvider } from "../providers/ConvexClientProvider";
import { MockAuthProvider } from "../providers/MockAuthProvider";
import { MockPushProvider } from "../providers/MockPushProvider";
import "../global.css";

export default function RootLayout(): JSX.Element | null {
  const [fontsLoaded] = useFonts({
    Lato_400Regular,
    Lato_700Bold,
    Lato_900Black,
    // Register the Ionicons glyph font so icons work regardless of the Expo Go
    // bundled version (avoids a "fontFamily Ionicons not loaded" fatal).
    ...Ionicons.font,
  });
  if (!fontsLoaded) return null;

  return (
    // ScopedTheme locks the whole app to the light/white theme, ignoring the
    // OS appearance (works in Expo Go and native builds alike).
    <ScopedTheme theme="light">
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ConvexClientProvider>
            <MockAuthProvider>
              <HeroUINativeProvider>
                <MockPushProvider>
                  <CelebrationProvider>
                    <StatusBar style="dark" />
                    <Stack screenOptions={{ headerShown: false }}>
                      {/* Self-contained edit flow as a modal (close = cancel). */}
                      <Stack.Screen
                        name="event/[id]/edit"
                        options={{ presentation: "modal" }}
                      />
                    </Stack>
                  </CelebrationProvider>
                </MockPushProvider>
              </HeroUINativeProvider>
            </MockAuthProvider>
          </ConvexClientProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ScopedTheme>
  );
}
