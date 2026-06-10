import { View } from "react-native";
import { Text } from "heroui-native";
import { Icon } from "./Icon";
import { PressableScale } from "./PressableScale";
import type { IconName } from "../lib/icons";

// A light, tinted secondary action (Apple "tinted button"): accent-soft fill,
// accent text. Used for the non-primary action(s) on a screen so there's only
// ever one bold filled CTA. (`accent-soft*` utilities are kept alive in
// global.css, so these classes are safe.)
const ACCENT_SOFT_FG = "#3D6B02"; // --color-accent-soft-foreground

export function SecondaryButton({
  label,
  onPress,
  icon,
  className,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  className?: string;
}) {
  return (
    <PressableScale
      onPress={onPress}
      className={className}
      style={{ borderRadius: 999 }}
    >
      <View className="flex-row items-center justify-center gap-2 bg-accent-soft rounded-full py-3 px-4">
        {icon && <Icon name={icon} size={17} color={ACCENT_SOFT_FG} />}
        <Text weight="semibold" className="text-accent-soft-foreground">
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}
