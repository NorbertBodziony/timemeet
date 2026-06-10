import { Avatar } from "heroui-native";

// Avatar: real photo when the user has one, deterministic-color initials
// otherwise (seed users have no photo).
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
  photoUrl,
  size = "md",
}: {
  name?: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Avatar size={size} color={colorFor(name)} alt={name ?? "user"}>
      {photoUrl ? <Avatar.Image source={{ uri: photoUrl }} /> : null}
      <Avatar.Fallback>{initials(name).toUpperCase()}</Avatar.Fallback>
    </Avatar>
  );
}
