import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import type { ErrorBoundaryProps } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native";
import type { JSX } from "react";
import { Pressable, Text as RNText, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ScopedTheme } from "uniwind";

import { t } from "../lib/i18n";
import { NotificationListener } from "../components/NotificationListener";
import { OfflineBanner } from "../components/OfflineBanner";
import { PushManager } from "../components/PushManager";
import { CelebrationProvider } from "../providers/CelebrationProvider";
import { ConvexClientProvider } from "../providers/ConvexClientProvider";
import { LanguageProvider } from "../providers/LanguageProvider";
import { MockAuthProvider } from "../providers/MockAuthProvider";
import { MockPushProvider } from "../providers/MockPushProvider";
import "../global.css";

// Calm crash screen (never blames the user — copy law). Plain RN primitives so
// it renders even if the theme/providers are what broke.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps): JSX.Element {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fafaf9",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        gap: 12,
      }}
    >
      <RNText style={{ fontSize: 56 }}>🦦</RNText>
      <RNText style={{ fontSize: 20, fontWeight: "700", color: "#1c1917" }}>
        {t("crash.title")}
      </RNText>
      <RNText style={{ fontSize: 14, color: "#78716c", textAlign: "center", lineHeight: 20 }}>
        {t("crash.body")}
      </RNText>
      <RNText style={{ fontSize: 11, color: "#a8a29e" }} numberOfLines={2}>
        {error.message}
      </RNText>
      <Pressable
        onPress={retry}
        style={{
          marginTop: 8,
          backgroundColor: "#5DA802",
          borderRadius: 999,
          paddingHorizontal: 28,
          paddingVertical: 12,
        }}
      >
        <RNText style={{ color: "#ffffff", fontWeight: "600", fontSize: 16 }}>{t("crash.retry")}</RNText>
      </Pressable>
    </View>
  );
}

export default function RootLayout(): JSX.Element | null {
  // Text renders in the iOS system font (San Francisco) by default — no custom
  // font needed. We only register the Ionicons glyph font so icons work
  // regardless of the Expo Go bundled version.
  const [fontsLoaded] = useFonts(Ionicons.font);
  if (!fontsLoaded) return null;

  return (
    // ScopedTheme locks the whole app to the light/white theme, ignoring the
    // OS appearance (works in Expo Go and native builds alike).
    <ScopedTheme theme="light">
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ConvexClientProvider>
            <MockAuthProvider>
              <LanguageProvider>
              <HeroUINativeProvider>
                <MockPushProvider>
                  <CelebrationProvider>
                    <StatusBar style="dark" />
                    <OfflineBanner />
                    <NotificationListener />
                    <PushManager />
                    <Stack screenOptions={{ headerShown: false }}>
                      {/* Settings is a nested stack — force a full-screen card
                          push (not a sheet) so the back arrow reads right. */}
                      <Stack.Screen name="settings" options={{ presentation: "card" }} />
                      {/* Self-contained edit flow as a modal (close = cancel). */}
                      <Stack.Screen
                        name="event/[id]/edit"
                        options={{ presentation: "modal" }}
                      />
                      {/* Invite friends sheet (close = done). */}
                      <Stack.Screen
                        name="event/[id]/invite"
                        options={{ presentation: "modal" }}
                      />
                      {/* Create-crew sheet (close = cancel). */}
                      <Stack.Screen
                        name="crews/new"
                        options={{ presentation: "modal" }}
                      />
                      {/* QR friend-add flow. */}
                      <Stack.Screen name="qr" options={{ presentation: "modal" }} />
                      <Stack.Screen
                        name="scan"
                        options={{ presentation: "fullScreenModal" }}
                      />
                      <Stack.Screen
                        name="add/[code]"
                        options={{ presentation: "modal" }}
                      />
                      {/* Public guest poll voting (magic link). */}
                      <Stack.Screen
                        name="p/[token]"
                        options={{ presentation: "modal" }}
                      />
                      {/* Creation chooser (event vs the three poll kinds). */}
                      <Stack.Screen
                        name="create"
                        options={{ presentation: "modal" }}
                      />
                    </Stack>
                  </CelebrationProvider>
                </MockPushProvider>
              </HeroUINativeProvider>
              </LanguageProvider>
            </MockAuthProvider>
          </ConvexClientProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ScopedTheme>
  );
}
