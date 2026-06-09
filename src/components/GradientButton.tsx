import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { BRAND_GRADIENT, COLOR } from "../lib/theme";

// Primary CTA — the brand gradient via expo-linear-gradient (docs §4.3 bug note).
export function GradientButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={{ borderRadius: 16, overflow: "hidden", opacity: off ? 0.55 : 1 }}
    >
      <LinearGradient
        colors={BRAND_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingVertical: 15, paddingHorizontal: 20, alignItems: "center" }}
      >
        {loading ? (
          <ActivityIndicator color={COLOR.evergreen} />
        ) : (
          <Text style={{ color: COLOR.evergreen, fontSize: 16, fontWeight: "700" }}>
            {label}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}
