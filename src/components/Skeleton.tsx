import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { cardShadow } from "../lib/ui";

// A single shimmering placeholder block. Apple-style loading: show the shape of
// what's coming, not a spinning circle.
export function SkeletonBlock({
  className,
  style,
}: {
  className?: string;
  style?: object;
}) {
  const pulse = useSharedValue(0.5);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 750 }), -1, true);
  }, [pulse]);
  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <Animated.View
      className={`bg-default-soft rounded-xl ${className ?? ""}`}
      style={[animated, style]}
    />
  );
}

// A placeholder shaped like an EventCard, so the list keeps its rhythm while
// data loads in.
export function SkeletonCard() {
  return (
    <View
      className="mb-3 rounded-2xl bg-surface p-3.5 flex-row items-center gap-3"
      style={cardShadow}
    >
      <SkeletonBlock style={{ width: 48, height: 48 }} />
      <View className="flex-1 gap-2">
        <SkeletonBlock style={{ width: "70%", height: 16 }} />
        <SkeletonBlock style={{ width: "45%", height: 12 }} />
        <SkeletonBlock style={{ width: "30%", height: 12 }} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}
