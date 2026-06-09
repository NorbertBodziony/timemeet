import { View } from "react-native";
import { Text, useThemeColor } from "heroui-native";
import { Icon } from "./Icon";
import { PressableScale } from "./PressableScale";
import type { IconName } from "../lib/icons";

// A semantic colour key for a pill. "default" fills with a neutral dark (never
// red) — used for non-punishing options like "Not going" / "No".
export type PillColor = "success" | "warning" | "accent" | "default";

export type PillOption = {
  value: string;
  label: string;
  color: PillColor;
  icon?: IconName;
};

// One shared status-pill control. Selected = filled with its semantic colour;
// unselected = surface with a hairline border. Used by both the RSVP picker
// (2 columns) and poll voting (3 across). Theme colours come via useThemeColor
// (inline) so we don't depend on tree-shakable bg-* classes.
export function StatusPills({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: readonly PillOption[];
  value: string | null;
  onChange: (value: string) => void;
  columns?: 2 | 3;
}) {
  const success = useThemeColor("success");
  const warning = useThemeColor("warning");
  const accent = useThemeColor("accent");
  const foreground = useThemeColor("foreground");
  const muted = useThemeColor("muted");
  const surface = useThemeColor("surface");
  const border = useThemeColor("border");

  const fillFor: Record<PillColor, string> = {
    success,
    warning,
    accent,
    default: foreground, // neutral dark, not red
  };

  return (
    <View className={`flex-row gap-2.5 ${columns === 2 ? "flex-wrap" : ""}`}>
      {options.map((o) => {
        const active = value === o.value;
        const fill = fillFor[o.color];
        return (
          <PressableScale
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              width: columns === 2 ? "47.5%" : undefined,
              flex: columns === 3 ? 1 : undefined,
              backgroundColor: active ? fill : surface,
              borderColor: active ? fill : border,
              borderWidth: 1,
              borderRadius: 14,
              paddingVertical: 12,
            }}
          >
            <View className="flex-row items-center justify-center gap-1.5">
              {o.icon && (
                <Icon
                  name={o.icon}
                  size={17}
                  color={active ? "#FFFFFF" : o.color === "default" ? muted : fill}
                />
              )}
              <Text
                weight="semibold"
                style={{ color: active ? "#FFFFFF" : foreground }}
                numberOfLines={1}
              >
                {o.label}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}
