import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import { Text } from "heroui-native";
import { EventTabList } from "../../components/EventTabList";
import { PrimaryButton } from "../../components/PrimaryButton";

export default function MineScreen() {
  const router = useRouter();
  return (
    <EventTabList
      tab="mine"
      title="My events"
      empty="Your plans show up here. Start with one."
      right={
        <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
          <Text type="h3">⚙</Text>
        </Pressable>
      }
      action={
        <PrimaryButton label="New plan" onPress={() => router.push("/poll/new")} />
      }
    />
  );
}
