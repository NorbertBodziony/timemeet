import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { PrimaryButton } from "../../components/PrimaryButton";
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
        <Text color="muted">Ask the organizer for a fresh invite.</Text>
      </Screen>
    );
  }
  if (data.status === "not_found") {
    return (
      <Screen title="Invite not found">
        <Text color="muted">Double-check the link and try again.</Text>
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
      <View className="rounded-2xl bg-surface border border-border px-4 py-4 mb-6">
        <Text type="body-xs" weight="semibold" color="muted">
          {creator?.displayName ?? "Someone"} invited you
        </Text>
        <Text weight="semibold" className="mt-2">
          {formatDateTime(event.startsAt)}
        </Text>
        {!!(event.customAddress ?? event.placeId) && (
          <Text type="body-sm" color="muted" className="mt-0.5">
            {event.customAddress ?? event.placeId}
          </Text>
        )}
        <Text type="body-xs" weight="semibold" className="text-success mt-2">
          {going} going
        </Text>
      </View>

      {done ? (
        <View className="items-center py-4">
          <Text type="h3" weight="bold">
            {done === "not_going" ? "No worries — maybe next time." : "You're in! 🎉"}
          </Text>
          <View className="mt-5 w-full">
            <PrimaryButton
              label="Open the meetup"
              onPress={() => router.replace({ pathname: "/event/[id]", params: { id: event._id } })}
            />
          </View>
        </View>
      ) : (
        <>
          <Text type="body-sm" weight="semibold" color="muted" className="mb-2">
            Are you in?
          </Text>
          <RsvpPicker value={null} onChange={rsvp} />
        </>
      )}
    </Screen>
  );
}
