import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { useThemeColor } from "heroui-native";
import { tap } from "../lib/haptics";

// One editable star with a small spring pop when tapped — tactile, not flashy.
function EditableStar({
  filled,
  size,
  color,
  onPress,
}: {
  filled: boolean;
  size: number;
  color: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      hitSlop={6}
      onPress={() => {
        tap();
        scale.value = withSequence(
          withSpring(1.25, { damping: 12, stiffness: 300 }),
          withSpring(1, { damping: 14 })
        );
        onPress();
      }}
    >
      <Animated.View style={animated}>
        <Ionicons name={filled ? "star" : "star-outline"} size={size} color={color} />
      </Animated.View>
    </Pressable>
  );
}

// Star rating. Editable (tap 1–5) when `onChange` is given; otherwise read-only,
// supporting fractional values (averages) via half-stars.
export function StarRating({
  value,
  onChange,
  size = 22,
}: {
  value: number;
  onChange?: (stars: number) => void;
  size?: number;
}) {
  const accent = useThemeColor("accent");
  const muted = useThemeColor("muted");

  if (onChange) {
    return (
      <View className="flex-row gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <EditableStar
            key={n}
            filled={n <= value}
            size={size}
            color={n <= value ? accent : muted}
            onPress={() => onChange(n)}
          />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const name =
          value >= n ? "star" : value >= n - 0.5 ? "star-half" : "star-outline";
        return (
          <Ionicons
            key={n}
            name={name}
            size={size}
            color={value >= n - 0.5 ? accent : muted}
          />
        );
      })}
    </View>
  );
}
