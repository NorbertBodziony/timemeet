import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { EventTabList } from "../../components/EventTabList";
import { Icon } from "../../components/Icon";
import { NotificationBell } from "../../components/NotificationBell";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAuth } from "../../providers/MockAuthProvider";

export default function GoingScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const firstName = currentUser?.displayName?.split(" ")[0];

  return (
    <EventTabList
      tab="going"
      title={firstName ? `Hi, ${firstName}!` : "Your meetups"}
      subtitle="What are we planning?"
      empty="Quiet group chat? Drop a time and let's fix that."
      emptyLutek="thinking"
      right={
        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => router.push("/calendar" as never)} hitSlop={8}>
            <Icon name="calendar-outline" size={22} tint="foreground" />
          </Pressable>
          <NotificationBell />
        </View>
      }
      action={
        <PrimaryButton label="New plan" onPress={() => router.push("/create" as never)} />
      }
    />
  );
}
