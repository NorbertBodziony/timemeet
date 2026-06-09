import type { ReactNode } from "react";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { tap } from "../lib/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Tappable surface that depresses slightly (scale + dim) on touch, with a light
// selection haptic — the tactile feedback iOS users expect on cards and rows.
export function PressableScale({
  onPress,
  children,
  className,
  style,
  haptic = true,
  disabled,
}: {
  onPress?: () => void;
  children: ReactNode;
  className?: string;
  style?: object;
  haptic?: boolean;
  disabled?: boolean;
}) {
  const pressed = useSharedValue(0);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.02 }],
    opacity: 1 - pressed.value * 0.12,
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 90 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 140 });
      }}
      onPress={() => {
        if (haptic) tap();
        onPress?.();
      }}
      className={className}
      style={[animated, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
