import { View } from "react-native";
import { Text } from "heroui-native";

// Empty states are never empty — a short, warm line (docs §5). No mascot here.
export function EmptyState({ text }: { text: string }) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text color="muted" align="center">
        {text}
      </Text>
    </View>
  );
}
