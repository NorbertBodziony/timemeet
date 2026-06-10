import { Button, Spinner } from "heroui-native";
import { impact } from "../lib/haptics";

// Primary CTA using HeroUI Native's Button (default theme accent).
// Every press gets a light impact haptic — the "commit" thunk.
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
