import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Button, Input, Text } from "heroui-native";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Screen } from "../../../components/Screen";
import { RsvpPicker } from "../../../components/RsvpPicker";
import { formatDateTime } from "../../../lib/datetime";
import { type RsvpStatus } from "../../../lib/theme";
import { useAuth } from "../../../providers/MockAuthProvider";
import { usePush } from "../../../providers/MockPushProvider";

export default function EventDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id as Id<"events">;
  const { currentUser } = useAuth();
  const push = usePush();

  const data = useQuery(
    api.events.get,
    currentUser ? { eventId, userId: currentUser._id } : { eventId }
  );
  const posts = useQuery(api.posts.listForEvent, { eventId });
  const setRsvp = useMutation(api.rsvps.set);
  const addPost = useMutation(api.posts.add);
  const cancelEvent = useMutation(api.events.cancel);
  const createToken = useMutation(api.invites.createToken);

  const [draft, setDraft] = useState("");

  if (data === undefined) return <Screen title="Loading…">{null}</Screen>;
  if (data === null) return <Screen title="Event not found">{null}</Screen>;

  const { event, creator, counts, viewerStatus } = data;
  const isOrganizer = currentUser?._id === event.creatorId;
  const place = event.customAddress ?? event.placeId ?? "";
  const cancelled = event.status === "cancelled";

  async function onRsvp(status: RsvpStatus) {
    if (!currentUser) return;
    await setRsvp({ userId: currentUser._id, eventId, status });
    if (status === "going") push.push({ title: `You're in — ${event.title}` });
  }

  async function post() {
    if (!currentUser || !draft.trim()) return;
    await addPost({ userId: currentUser._id, eventId, body: draft.trim(), isAnnouncement: isOrganizer });
    setDraft("");
  }

  async function share() {
    if (!currentUser) return;
    const token = await createToken({ userId: currentUser._id, eventId });
    Alert.alert("Share link (mock)", `meettime://invite/${token}`);
  }

  function confirmCancel() {
    Alert.alert("Cancel this meetup?", "Everyone invited will be notified.", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Continue",
        style: "destructive",
        onPress: () =>
          Alert.alert("Are you sure?", "This can't be undone.", [
            { text: "Keep it", style: "cancel" },
            {
              text: "Yes, cancel",
              style: "destructive",
              onPress: async () => {
                if (!currentUser) return;
                await cancelEvent({ userId: currentUser._id, eventId });
                router.back();
              },
            },
          ]),
      },
    ]);
  }

  return (
    <Screen title={event.title}>
      {cancelled && (
        <Text type="body-sm" weight="semibold" className="text-danger mb-3">
          This meetup was cancelled.
        </Text>
      )}

      <View className="rounded-2xl bg-surface border border-border px-4 py-3 mb-5">
        <Text weight="semibold">{formatDateTime(event.startsAt)}</Text>
        {!!place && (
          <Text type="body-sm" color="muted" className="mt-0.5">
            {place}
          </Text>
        )}
        {!!event.description && (
          <Text type="body-sm" color="muted" className="mt-2">
            {event.description}
          </Text>
        )}
        <Text type="body-xs" weight="semibold" className="text-success mt-2">
          {counts.going} going · {counts.maybe} maybe · {counts.waitlist} waitlist
        </Text>
        <Text type="body-xs" color="muted" className="mt-0.5">
          Organized by {creator?.displayName ?? "—"}
        </Text>
      </View>

      {!cancelled && (
        <>
          <Text type="body-sm" weight="semibold" color="muted" className="mb-2">
            Are you in?
          </Text>
          <RsvpPicker value={viewerStatus} onChange={onRsvp} />
        </>
      )}

      {/* Board */}
      <Text type="body-sm" weight="semibold" color="muted" className="mb-2 mt-7">
        Board
      </Text>
      <View className="flex-row gap-2 mb-3 items-center">
        <View className="flex-1">
          <Input value={draft} onChangeText={setDraft} placeholder="Say something to the crew…" />
        </View>
        <Button variant="primary" size="md" onPress={post}>
          <Button.Label>Send</Button.Label>
        </Button>
      </View>
      {(posts ?? []).map((p) => (
        <View key={p._id} className="mb-2 rounded-xl bg-surface border border-border px-3 py-2.5">
          <Text type="body-xs" weight="semibold" color="muted" className="mb-0.5">
            {p.author?.displayName ?? "—"}
            {p.isAnnouncement ? " · announcement" : ""}
          </Text>
          <Text type="body-sm">{p.body}</Text>
        </View>
      ))}

      {isOrganizer && !cancelled && (
        <View className="mt-7 gap-2">
          <Button
            variant="outline"
            size="md"
            onPress={() => router.push({ pathname: "/event/[id]/edit", params: { id: eventId } })}
          >
            <Button.Label>Edit meetup</Button.Label>
          </Button>
          <Button variant="outline" size="md" onPress={share}>
            <Button.Label>Share invite link</Button.Label>
          </Button>
          <Button variant="danger" size="md" onPress={confirmCancel}>
            <Button.Label>Cancel meetup</Button.Label>
          </Button>
        </View>
      )}
    </Screen>
  );
}
