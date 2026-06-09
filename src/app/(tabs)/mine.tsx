import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";
import { EventTabList } from "../../components/EventTabList";
import { GradientButton } from "../../components/GradientButton";

export default function MineScreen() {
  const router = useRouter();
  return (
    <EventTabList
      tab="mine"
      title="My events"
      empty="Your plans show up here. Start with one."
      right={
        <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
          <Text style={{ fontSize: 22, color: "#0F1A00" }}>⚙</Text>
        </Pressable>
      }
      action={
        <GradientButton label="New plan" onPress={() => router.push("/poll/new")} />
      }
    />
  );
}
