import { useRouter } from "expo-router";
import { EventTabList } from "../../components/EventTabList";
import { GradientButton } from "../../components/GradientButton";

export default function GoingScreen() {
  const router = useRouter();
  return (
    <EventTabList
      tab="going"
      title="Your meetups"
      empty="Quiet group chat? Drop a time."
      action={
        <GradientButton label="New plan" onPress={() => router.push("/poll/new")} />
      }
    />
  );
}
