import type { ReactNode } from "react";
import { Keyboard, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "heroui-native";
import { Icon } from "./Icon";
import { TITLE_TRACKING } from "../lib/ui";

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
  bottomInset = 0,
  refreshing,
  onRefresh,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  right?: ReactNode; // optional top-right header action (e.g. settings gear)
  dismiss?: "back" | "close";
  bottomInset?: number; // extra bottom padding (e.g. clear a translucent tab bar)
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const onDismiss = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/"); // entry gate → onboarding or home
  };

  const dismissBtn = dismiss ? (
    <Pressable
      onPress={onDismiss}
      hitSlop={12}
      className="h-9 w-9 rounded-full items-center justify-center bg-surface border border-border"
    >
      <Icon name={dismiss === "close" ? "close" : "chevron-back"} size={20} tint="foreground" />
    </Pressable>
  ) : null;

  // Back uses the iOS large-title pattern (chevron above the title); a close (X)
  // sits inline at the top-right of the title row.
  const backBtn = dismiss === "back" ? dismissBtn : null;
  const closeBtn = dismiss === "close" ? dismissBtn : null;

  const header = (
    <>
      {backBtn ? <View className="-ml-1 mb-1">{backBtn}</View> : null}
      <View className="mb-4 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          {title && (
            <Text type="h1" weight="bold" style={{ letterSpacing: TITLE_TRACKING }}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text color="muted" className="mt-1">
              {subtitle}
            </Text>
          )}
        </View>
        {right || closeBtn ? (
          <View className="pt-1 flex-row items-center gap-2">
            {right}
            {closeBtn}
          </View>
        ) : null}
      </View>
    </>
  );

  const showHeader = title || subtitle || dismissBtn;

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
        paddingBottom: insets.bottom + 32 + bottomInset,
      }}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      {/* Tapping empty space closes the keyboard — number pads have no return key. */}
      <Pressable onPress={Keyboard.dismiss} accessible={false}>
        {showHeader && header}
        {children}
      </Pressable>
    </ScrollView>
  );
}
