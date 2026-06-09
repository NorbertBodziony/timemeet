import { Text } from "heroui-native";

// The small label above a form field. One place so every form reads the same.
export function FormLabel({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <Text
      type="body-sm"
      weight="semibold"
      color="muted"
      className={`mb-1.5 ml-0.5 ${className ?? ""}`}
    >
      {children}
    </Text>
  );
}
