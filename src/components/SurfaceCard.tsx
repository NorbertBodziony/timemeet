import type { ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { PressableScale } from "./PressableScale";
import { cardShadow } from "../lib/ui";

// One card recipe for every list item: bg-surface, one radius, one soft shadow,
// no border (border + shadow together reads heavy). Children supply their own
// inner padding via `className`. Pass `onPress` to make it tappable.
// Cards fade in and re-flow smoothly — live Convex updates (a fresh RSVP, a new
// post) glide into place instead of snapping (calm motion, ~200ms).
export function SurfaceCard({
  children,
  className,
  onPress,
}: {
  children: ReactNode;
  className?: string;
  onPress?: () => void;
}) {
  const inner = (
    <View
      className={`rounded-2xl bg-surface px-3.5 py-3 ${className ?? ""}`}
      style={cardShadow}
    >
      {children}
    </View>
  );
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      layout={LinearTransition.duration(180)}
    >
      {onPress ? <PressableScale onPress={onPress}>{inner}</PressableScale> : inner}
    </Animated.View>
  );
}
