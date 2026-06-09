import { Text } from "heroui-native";

// A list/section header — uppercase, muted, tracking-wide, consistent rhythm.
// Matches the iOS grouped-list section label. `tight` removes the top margin
// when the header is the first thing on a screen.
export function SectionHeader({
  children,
  tight,
}: {
  children: string;
  tight?: boolean;
}) {
  return (
    <Text
      type="body-xs"
      weight="semibold"
      color="muted"
      className={`ml-1 mb-2 tracking-wider ${tight ? "" : "mt-7"}`}
    >
      {children.toUpperCase()}
    </Text>
  );
}
