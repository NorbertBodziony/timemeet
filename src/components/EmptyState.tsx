import { View } from "react-native";
import { Text } from "heroui-native";
import { Icon } from "./Icon";
import { Lutek, type LutekMood } from "./Lutek";
import type { IconName } from "../lib/icons";

// Empty states are never empty — a muted icon + short warm line (docs §5). On a
// few named empties, Lutek shows up with the line in a speech bubble instead.
export function EmptyState({
  text,
  icon = "calendar-outline",
  lutek,
}: {
  text: string;
  icon?: IconName;
  lutek?: LutekMood;
}) {
  if (lutek) {
    return (
      <View className="flex-1 items-center justify-center px-8 py-20">
        <Lutek mood={lutek} line={text} />
      </View>
    );
  }
  return (
    <View className="flex-1 items-center justify-center px-8 py-20 gap-4">
      <View className="w-16 h-16 rounded-full bg-default-soft items-center justify-center">
        <Icon name={icon} size={28} tint="muted" />
      </View>
      <Text color="muted" align="center" className="max-w-[260px] leading-5">
        {text}
      </Text>
    </View>
  );
}
