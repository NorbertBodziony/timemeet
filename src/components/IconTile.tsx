import { View } from "react-native";
import { Icon } from "./Icon";
import type { IconName } from "../lib/icons";

// The rounded icon container used in onboarding, empty states, permission
// prompts, etc. Sizes unify the scattered h-8 / h-10 / h-16 one-offs.
const SIZES = {
  sm: { box: "w-8 h-8 rounded-lg", icon: 16 },
  md: { box: "w-10 h-10 rounded-xl", icon: 20 },
  lg: { box: "w-16 h-16 rounded-2xl", icon: 28 },
} as const;

export function IconTile({
  name,
  size = "md",
  tone = "accent",
}: {
  name: IconName;
  size?: keyof typeof SIZES;
  tone?: "accent" | "neutral";
}) {
  const s = SIZES[size];
  const bg = tone === "accent" ? "bg-accent-soft" : "bg-default-soft";
  const tint = tone === "accent" ? "accent" : "muted";
  return (
    <View className={`${s.box} ${bg} items-center justify-center`}>
      <Icon name={name} size={s.icon} tint={tint} />
    </View>
  );
}
