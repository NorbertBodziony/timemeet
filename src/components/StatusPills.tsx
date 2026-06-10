import { View } from "react-native";
import { Text, useThemeColor } from "heroui-native";
import { Icon } from "./Icon";
import { PressableScale } from "./PressableScale";
import type { IconName } from "../lib/icons";

export type PillOption = {
  value: string;
  label: string;
  fill: string; // the status color (brand sheet §03) — selected bg / icon tint
  icon?: IconName;
};

// One shared status-pill control. Selected = filled with its status colour;
// unselected = surface with a hairline border, icon tinted with the status
// colour. Used by the RSVP picker (2 columns) and poll voting (3 across).
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
  const foreground = useThemeColor("foreground");
  const surface = useThemeColor("surface");
  const border = useThemeColor("border");

  return (
    <View className={`flex-row gap-2.5 ${columns === 2 ? "flex-wrap" : ""}`}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <PressableScale
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              width: columns === 2 ? "47.5%" : undefined,
              flex: columns === 3 ? 1 : undefined,
              backgroundColor: active ? o.fill : surface,
              borderColor: active ? o.fill : border,
              borderWidth: 1,
              borderRadius: 14,
              paddingVertical: 12,
            }}
          >
            <View className="flex-row items-center justify-center gap-1.5">
              {o.icon && (
                <Icon name={o.icon} size={17} color={active ? "#FFFFFF" : o.fill} />
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
