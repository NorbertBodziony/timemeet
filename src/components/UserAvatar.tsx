import { Avatar } from "heroui-native";

// Initials avatar from a display name (seed users have no photo). Deterministic
// color so the same person reads consistently across screens.
const COLORS = ["accent", "success", "warning", "danger", "default"] as const;

function initials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function colorFor(name?: string): (typeof COLORS)[number] {
  let h = 0;
  for (const ch of name ?? "") h = (h * 31 + ch.charCodeAt(0)) % 997;
  return COLORS[h % COLORS.length];
}

export function UserAvatar({
  name,
  size = "md",
}: {
  name?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Avatar size={size} color={colorFor(name)} alt={name ?? "user"}>
      <Avatar.Fallback>{initials(name).toUpperCase()}</Avatar.Fallback>
    </Avatar>
  );
}
