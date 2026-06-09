import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "heroui-native";

// Standard screen on HeroUI's default light theme. Calm, lots of breathing room.
export function Screen({
  title,
  subtitle,
  children,
  scroll = true,
  right,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  right?: ReactNode; // optional top-right header action (e.g. settings gear)
}) {
  const insets = useSafeAreaInsets();
  const header = (
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
  );

  if (!scroll) {
    return (
      <View className="flex-1 bg-background px-5" style={{ paddingTop: insets.top + 12 }}>
        {(title || subtitle) && header}
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
      {(title || subtitle) && header}
      {children}
    </ScrollView>
  );
}
