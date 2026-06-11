import { Avatar } from "heroui-native";

// Avatar: real photo when the user has one, brand-accent initials otherwise —
// one consistent color across the app (no per-user rainbow).
function initials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
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
    <Avatar size={size} color="accent" alt={name ?? "user"}>
      {photoUrl ? <Avatar.Image source={{ uri: photoUrl }} /> : null}
      <Avatar.Fallback>{initials(name).toUpperCase()}</Avatar.Fallback>
    </Avatar>
  );
}
