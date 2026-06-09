import { View } from "react-native";
import { Text } from "heroui-native";

// Lutek — MeetTime's otter. The brand voice shows up in a few calm moments
// (named empty states + joy beats), never everywhere. Emoji-based for now.
export type LutekMood = "thinking" | "waving" | "celebrating";

const FACE: Record<LutekMood, string> = {
  thinking: "🦦",
  waving: "🦦",
  celebrating: "🦦",
};

export function Lutek({
  mood = "waving",
  line,
  size = 64,
}: {
  mood?: LutekMood;
  line?: string;
  size?: number;
}) {
  return (
    <View className="items-center gap-3">
      {!!line && (
        <View className="bg-accent-soft rounded-2xl px-4 py-2.5 max-w-[280px]">
          <Text align="center" className="text-accent-soft-foreground">
            {line}
          </Text>
        </View>
      )}
      <View
        className="rounded-full bg-default-soft items-center justify-center"
        style={{ width: size + 24, height: size + 24 }}
      >
        <Text style={{ fontSize: size }}>{FACE[mood]}</Text>
      </View>
    </View>
  );
}
