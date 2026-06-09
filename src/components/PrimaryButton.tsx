import { Button, Spinner } from "heroui-native";

// Primary CTA using HeroUI Native's Button (default theme accent).
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
      onPress={onPress}
      isDisabled={disabled || loading}
    >
      {loading ? <Spinner size="sm" /> : <Button.Label>{label}</Button.Label>}
    </Button>
  );
}
