import { useRouter } from "expo-router";
import { EventTabList } from "../../components/EventTabList";
import { GradientButton } from "../../components/GradientButton";

export default function MineScreen() {
  const router = useRouter();
  return (
    <EventTabList
      tab="mine"
      title="My events"
      empty="Your plans show up here. Start with one."
      action={
        <GradientButton label="New plan" onPress={() => router.push("/poll/new")} />
      }
    />
  );
}
