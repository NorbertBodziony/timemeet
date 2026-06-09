import type { ReactNode } from "react";
import { View } from "react-native";
import { PressableScale } from "./PressableScale";
import { cardShadow } from "../lib/ui";

// One card recipe for every list item: bg-surface, one radius, one soft shadow,
// no border (border + shadow together reads heavy). Children supply their own
// inner padding via `className`. Pass `onPress` to make it tappable.
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
  return onPress ? (
    <PressableScale onPress={onPress}>{inner}</PressableScale>
  ) : (
    inner
  );
}
