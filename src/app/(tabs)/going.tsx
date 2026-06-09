import { useRouter } from "expo-router";
import { EventTabList } from "../../components/EventTabList";
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
      empty="Quiet group chat? Drop a time."
      emptyIcon="checkmark-circle-outline"
      right={<NotificationBell />}
      action={
        <PrimaryButton label="New plan" onPress={() => router.push("/poll/new")} />
      }
    />
  );
}
