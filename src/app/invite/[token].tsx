import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { GradientButton } from "../../components/GradientButton";
import { RsvpPicker } from "../../components/RsvpPicker";
import { Screen } from "../../components/Screen";
import { formatDateTime } from "../../lib/datetime";
import { type RsvpStatus } from "../../lib/theme";
import { useAuth } from "../../providers/MockAuthProvider";
import { usePush } from "../../providers/MockPushProvider";

// ⭐ Invited flow (docs §3.8). RSVP first, then (mock) auth is already present,
// so we confirm immediately. Target: RSVP in < 30s.
export default function InviteLanding() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { currentUser } = useAuth();
  const push = usePush();
  const now = useMemo(() => Date.now(), []);

  const data = useQuery(api.invites.resolve, { token: token ?? "", now });
  const setRsvp = useMutation(api.rsvps.set);
  const [done, setDone] = useState<RsvpStatus | null>(null);

  if (data === undefined) return <Screen title="Loading…">{null}</Screen>;

  if (data.status === "expired") {
    return (
      <Screen title="This link has expired">
        <Text className="text-brand-evergreen/65 text-[15px]">
          Ask the organizer for a fresh invite.
        </Text>
      </Screen>
    );
  }
  if (data.status === "not_found") {
    return (
      <Screen title="Invite not found">
        <Text className="text-brand-evergreen/65 text-[15px]">
          Double-check the link and try again.
        </Text>
      </Screen>
    );
  }

  const { event, creator, going } = data;

  async function rsvp(status: RsvpStatus) {
    if (!currentUser) return;
    await setRsvp({ userId: currentUser._id, eventId: event._id, status });
    setDone(status);
    if (status === "going") {
      push.push({ title: `Nice, we'll let ${creator?.displayName ?? "them"} know!` });
    }
  }

  return (
    <Screen title={event.title}>
      <View className="rounded-2xl bg-surface border border-brand-evergreen/10 px-4 py-4 mb-6">
        <Text className="text-brand-evergreen/45 text-[12px] font-semibold">
          {creator?.displayName ?? "Someone"} invited you
        </Text>
        <Text className="text-brand-evergreen text-[15px] font-semibold mt-2">
          {formatDateTime(event.startsAt)}
        </Text>
        {!!(event.customAddress ?? event.placeId) && (
          <Text className="text-brand-evergreen/65 text-[13px] mt-0.5">
            {event.customAddress ?? event.placeId}
          </Text>
        )}
        <Text className="text-rsvp-going text-[12px] font-semibold mt-2">
          {going} going
        </Text>
      </View>

      {done ? (
        <View className="items-center py-4">
          <Text className="text-brand-evergreen text-[17px] font-bold">
            {done === "not_going"
              ? "No worries — maybe next time."
              : "You're in! 🎉"}
          </Text>
          <View className="mt-5 w-full">
            <GradientButton
              label="Open the meetup"
              onPress={() =>
                router.replace({
                  pathname: "/event/[id]",
                  params: { id: event._id },
                })
              }
            />
          </View>
        </View>
      ) : (
        <>
          <Text className="text-brand-evergreen/65 text-[13px] mb-2 font-semibold">
            Are you in?
          </Text>
          <RsvpPicker value={null} onChange={rsvp} />
        </>
      )}
    </Screen>
  );
}
