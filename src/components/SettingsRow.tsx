import { Pressable, View } from "react-native";
import { Switch, Text } from "heroui-native";

// A tappable settings row with a chevron.
export function SettingsRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-2xl bg-surface border border-border px-4 py-3.5 mb-2"
    >
      <Text weight="semibold">{label}</Text>
      <View className="flex-row items-center gap-2">
        {!!value && (
          <Text type="body-sm" color="muted">
            {value}
          </Text>
        )}
        <Text type="body" color="muted">
          ›
        </Text>
      </View>
    </Pressable>
  );
}

// A settings row with a HeroUI switch on the right.
export function ToggleRow({
  label,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View
      className="flex-row items-center justify-between rounded-2xl bg-surface border border-border px-4 py-3 mb-2"
      style={{ opacity: disabled ? 0.45 : 1 }}
    >
      <Text weight="semibold" className="flex-1 pr-3">
        {label}
      </Text>
      <Switch isSelected={value} onSelectedChange={onValueChange} isDisabled={disabled} />
    </View>
  );
}
