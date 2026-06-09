import { Text, View } from "react-native";

// Empty states are never empty — a short, warm line (docs §5). No mascot here.
export function EmptyState({ text }: { text: string }) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-brand-evergreen/55 text-[15px] text-center leading-6">
        {text}
      </Text>
    </View>
  );
}
