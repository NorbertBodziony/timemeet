import { View } from "react-native";
import { Text } from "heroui-native";
import { Icon } from "./Icon";
import type { IconName } from "../lib/icons";

// Empty states are never empty — a muted icon + short warm line (docs §5).
export function EmptyState({
  text,
  icon = "calendar-outline",
}: {
  text: string;
  icon?: IconName;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-20 gap-3">
      <Icon name={icon} size={40} tint="muted" />
      <Text color="muted" align="center">
        {text}
      </Text>
    </View>
  );
}
