import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import { EventTabList } from "../../components/EventTabList";
import { Icon } from "../../components/Icon";
import { PrimaryButton } from "../../components/PrimaryButton";

export default function MineScreen() {
  const router = useRouter();
  return (
    <EventTabList
      tab="mine"
      title="My events"
      empty="Your plans show up here. Start with one."
      emptyIcon="calendar-outline"
      right={
        <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
          <Icon name="settings-outline" size={22} tint="foreground" />
        </Pressable>
      }
      action={
        <PrimaryButton label="New plan" onPress={() => router.push("/poll/new")} />
      }
    />
  );
}
