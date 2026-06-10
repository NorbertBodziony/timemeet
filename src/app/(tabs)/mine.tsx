import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { EventTabList } from "../../components/EventTabList";
import { Icon } from "../../components/Icon";
import { MyPolls } from "../../components/MyPolls";

export default function MineScreen() {
  const router = useRouter();
  return (
    <EventTabList
      tab="mine"
      title="My events"
      empty="Your plans show up here. Start with one."
      emptyLutek="waving"
      action={<MyPolls />}
      right={
        // Nav-style actions — home keeps the single hero CTA, this tab gets a "+".
        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => router.push("/poll/new")} hitSlop={8}>
            <Icon name="add-circle-outline" size={24} tint="accent" />
          </Pressable>
          <Pressable onPress={() => router.push("/settings")} hitSlop={8}>
            <Icon name="settings-outline" size={22} tint="foreground" />
          </Pressable>
        </View>
      }
    />
  );
}
