import type { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "heroui-native";
import { Icon } from "./Icon";

// Standard screen on HeroUI's default light theme. Calm, lots of breathing room.
// `dismiss` adds a leading back/close control so a screen is never a dead end —
// it goes back if there's history, otherwise falls back to the app entry.
export function Screen({
  title,
  subtitle,
  children,
  scroll = true,
  right,
  dismiss,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  right?: ReactNode; // optional top-right header action (e.g. settings gear)
  dismiss?: "back" | "close";
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const onDismiss = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/"); // entry gate → onboarding or home
  };

  const nav = dismiss ? (
    <Pressable
      onPress={onDismiss}
      hitSlop={12}
      className="h-9 w-9 -ml-1 mb-1 rounded-full items-center justify-center bg-surface border border-border"
    >
      <Icon name={dismiss === "close" ? "close" : "chevron-back"} size={20} tint="foreground" />
    </Pressable>
  ) : null;

  const header = (
    <>
      {nav}
      <View className="mb-4 flex-row items-start justify-between">
        <View className="flex-1">
          {title && (
            <Text type="h1" weight="bold">
              {title}
            </Text>
          )}
          {subtitle && (
            <Text color="muted" className="mt-1">
              {subtitle}
            </Text>
          )}
        </View>
        {right ? <View className="ml-3 pt-1">{right}</View> : null}
      </View>
    </>
  );

  const showHeader = title || subtitle || nav;

  if (!scroll) {
    return (
      <View className="flex-1 bg-background px-5" style={{ paddingTop: insets.top + 12 }}>
        {showHeader && header}
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      {showHeader && header}
      {children}
    </ScrollView>
  );
}
