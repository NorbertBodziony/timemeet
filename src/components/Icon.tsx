import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import type { IconName } from "../lib/icons";

// Themed Ionicon. `tint` is a HeroUI theme color key (foreground/muted/accent/
// success/warning/danger/...), or pass an explicit `color`.
export function Icon({
  name,
  size = 20,
  tint = "foreground",
  color,
}: {
  name: IconName;
  size?: number;
  tint?: string;
  color?: string;
}) {
  const themed = useThemeColor(tint as never);
  return <Ionicons name={name} size={size} color={color ?? themed} />;
}
