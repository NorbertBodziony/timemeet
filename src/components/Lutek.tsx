import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Text } from "heroui-native";

// Lutek — MeetTime's otter. The brand voice shows up in a few calm moments
// (named empty states + joy beats), never everywhere. Emoji-based for now,
// with a slow idle bob so he reads as alive, not as a frozen glyph.
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
  // Calm breathing bob — 2.4s cycle, 3pt travel. Never frantic.
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) })
      ),
      -1
    );
  }, [bob]);
  const bobbing = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }],
  }));

  return (
    <View className="items-center gap-3">
      {!!line && (
        <View className="bg-accent-soft rounded-2xl px-4 py-2.5 max-w-[280px]">
          <Text align="center" className="text-accent-soft-foreground">
            {line}
          </Text>
        </View>
      )}
      <Animated.View
        className="rounded-full bg-default-soft items-center justify-center"
        style={[{ width: size + 24, height: size + 24 }, bobbing]}
      >
        <Text style={{ fontSize: size }}>{FACE[mood]}</Text>
      </Animated.View>
    </View>
  );
}
