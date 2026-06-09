import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Card, Separator, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { Icon } from "../../components/Icon";
import { PrimaryButton } from "../../components/PrimaryButton";
import { RsvpPicker } from "../../components/RsvpPicker";
import { Screen } from "../../components/Screen";
import { UserAvatar } from "../../components/UserAvatar";
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
      <Card className="mb-6">
        <Card.Body className="gap-2">
          <View className="flex-row items-center gap-2">
            <UserAvatar name={creator?.displayName} size="sm" />
            <Text type="body-xs" weight="semibold" color="muted">
              {creator?.displayName ?? "Someone"} invited you
            </Text>
          </View>
          <Separator className="my-1" />
          <View className="flex-row items-center gap-2">
            <Icon name="calendar-outline" size={16} tint="accent" />
            <Text weight="semibold">{formatDateTime(event.startsAt)}</Text>
          </View>
          {!!(event.customAddress ?? event.placeId) && (
            <View className="flex-row items-center gap-2">
              <Icon name="location-outline" size={16} tint="muted" />
              <Text type="body-sm" color="muted">
                {event.customAddress ?? event.placeId}
              </Text>
            </View>
          )}
          <View className="flex-row items-center gap-2">
            <Icon name="people-outline" size={16} tint="success" />
            <Text type="body-xs" weight="semibold" className="text-success">
              {going} going
            </Text>
          </View>
        </Card.Body>
      </Card>

      {done ? (
        <View className="items-center py-4">
          <Icon
            name={done === "not_going" ? "heart-outline" : "checkmark-circle"}
            size={40}
            tint={done === "not_going" ? "muted" : "success"}
          />
          <Text type="h3" weight="bold" className="mt-2">
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
          <Text type="body-sm" weight="semibold" color="muted" className="mb-2 ml-1">
            Are you in?
          </Text>
          <RsvpPicker value={null} onChange={rsvp} />
        </>
      )}
    </Screen>
  );
}
