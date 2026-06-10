import { LinearGradient } from "expo-linear-gradient";
import { Button, Spinner, Text } from "heroui-native";
import { PressableScale } from "./PressableScale";
import { impact } from "../lib/haptics";
import { GRADIENTS } from "../lib/theme";

// Primary CTA — the BRIGHT brand gradient (brand sheet §04), white label, pill
// shape, light impact haptic on press. Non-primary variants fall back to the
// HeroUI Button.
export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
}) {
  if (variant === "primary") {
    const off = disabled || loading;
    return (
      <PressableScale
        haptic={false}
        disabled={off}
        onPress={() => {
          impact();
          onPress();
        }}
        style={{ borderRadius: 999, opacity: off ? 0.5 : 1 }}
      >
        <LinearGradient
          colors={[...GRADIENTS.bright.colors]}
          locations={[...GRADIENTS.bright.locations]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 999,
            paddingVertical: 15,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? (
            <Spinner size="sm" color="#FFFFFF" />
          ) : (
            <Text weight="semibold" style={{ color: "#FFFFFF", fontSize: 16 }}>
              {label}
            </Text>
          )}
        </LinearGradient>
      </PressableScale>
    );
  }

  return (
    <Button
      variant={variant}
      size="lg"
      onPress={() => {
        impact();
        onPress();
      }}
      isDisabled={disabled || loading}
    >
      {loading ? <Spinner size="sm" /> : <Button.Label>{label}</Button.Label>}
    </Button>
  );
}
