import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Standard white screen with an optional H1 title. Calm, lots of breathing room.
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
          <Text className="text-brand-evergreen text-[26px] font-bold tracking-tight">
            {title}
          </Text>
        )}
        {subtitle && (
          <Text className="text-brand-evergreen/65 text-[15px] mt-1">{subtitle}</Text>
        )}
      </View>
      {right ? <View className="ml-3 pt-1">{right}</View> : null}
    </View>
  );

  if (!scroll) {
    return (
      <View
        className="flex-1 bg-canvas px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        {(title || subtitle) && header}
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-canvas"
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
