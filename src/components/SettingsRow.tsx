import { Pressable, Switch, Text, View } from "react-native";

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
      className="flex-row items-center justify-between rounded-2xl bg-surface border border-brand-evergreen/10 px-4 py-3.5 mb-2"
    >
      <Text className="text-brand-evergreen text-[15px] font-semibold">{label}</Text>
      <View className="flex-row items-center gap-2">
        {!!value && (
          <Text className="text-brand-evergreen/45 text-[13px]">{value}</Text>
        )}
        <Text className="text-brand-evergreen/30 text-[18px]">›</Text>
      </View>
    </Pressable>
  );
}

// A settings row with a switch on the right.
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
      className="flex-row items-center justify-between rounded-2xl bg-surface border border-brand-evergreen/10 px-4 py-3 mb-2"
      style={{ opacity: disabled ? 0.45 : 1 }}
    >
      <Text className="text-brand-evergreen text-[15px] font-semibold flex-1 pr-3">
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: "#5DA802", false: "#D7DED0" }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
