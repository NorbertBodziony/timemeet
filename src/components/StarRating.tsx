import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { useThemeColor } from "heroui-native";
import { tap } from "../lib/haptics";

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
          <Pressable
            key={n}
            hitSlop={6}
            onPress={() => {
              tap();
              onChange(n);
            }}
          >
            <Ionicons
              name={n <= value ? "star" : "star-outline"}
              size={size}
              color={n <= value ? accent : muted}
            />
          </Pressable>
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
