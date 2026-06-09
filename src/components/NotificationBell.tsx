import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Icon } from "./Icon";
import { useAuth } from "../providers/MockAuthProvider";

// Bell with an unread dot (reactive). Opens the notifications inbox.
export function NotificationBell() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const unread = useQuery(
    api.notifications.unreadCount,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  return (
    <Pressable onPress={() => router.push("/notifications")} hitSlop={10}>
      <View>
        <Icon name="notifications-outline" size={22} tint="foreground" />
        {!!unread && unread > 0 && (
          <View className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-danger" />
        )}
      </View>
    </Pressable>
  );
}
