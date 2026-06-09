import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Share, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Button, Card, Input, Separator, Text } from "heroui-native";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Icon } from "../../../components/Icon";
import { Screen } from "../../../components/Screen";
import { RsvpPicker } from "../../../components/RsvpPicker";
import { UserAvatar } from "../../../components/UserAvatar";
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
  const rsvps = useQuery(api.rsvps.listForEvent, { eventId });
  const posts = useQuery(api.posts.listForEvent, { eventId });
  const setRsvp = useMutation(api.rsvps.set);
  const addPost = useMutation(api.posts.add);
  const cancelEvent = useMutation(api.events.cancel);
  const createToken = useMutation(api.invites.createToken);

  const [draft, setDraft] = useState("");

  if (data === undefined) return <Screen title="Loading…" dismiss="back">{null}</Screen>;
  if (data === null)
    return <Screen title="Event not found" dismiss="back">{null}</Screen>;

  const { event, creator, counts, viewerStatus } = data;
  const isOrganizer = currentUser?._id === event.creatorId;
  const place = event.customAddress ?? event.placeId ?? "";
  const cancelled = event.status === "cancelled";
  const going = (rsvps ?? []).filter((r) => r.status === "going");

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
    const url = `meettime://invite/${token}`;
    try {
      await Share.share({ message: `Join me — ${event.title}\n${url}`, url });
    } catch {
      Alert.alert("Couldn't open share", url);
    }
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
    <Screen title={event.title} dismiss="back">
      {cancelled && (
        <View className="flex-row items-center gap-2 mb-3">
          <Icon name="close-circle" size={16} tint="danger" />
          <Text type="body-sm" weight="semibold" className="text-danger">
            This meetup was cancelled.
          </Text>
        </View>
      )}

      <Card className="mb-5">
        <Card.Body className="gap-2">
          <View className="flex-row items-center gap-2">
            <Icon name="calendar-outline" size={16} tint="accent" />
            <Text weight="semibold">{formatDateTime(event.startsAt)}</Text>
          </View>
          {!!place && (
            <View className="flex-row items-center gap-2">
              <Icon name="location-outline" size={16} tint="muted" />
              <Text type="body-sm" color="muted">
                {place}
              </Text>
            </View>
          )}
          {!!event.description && <Text type="body-sm" color="muted">{event.description}</Text>}
          <Separator className="my-1" />
          <View className="flex-row items-center gap-2">
            <UserAvatar name={creator?.displayName} size="sm" />
            <Text type="body-xs" color="muted">
              Organized by {creator?.displayName ?? "—"}
            </Text>
          </View>
        </Card.Body>
      </Card>

      {/* Going avatars */}
      {going.length > 0 && (
        <View className="mb-5">
          <Text type="body-xs" weight="semibold" color="muted" className="mb-2 ml-1">
            {counts.going} GOING · {counts.maybe} MAYBE
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {going.map((r) => (
              <View key={r._id} className="items-center gap-1 w-14">
                <UserAvatar name={r.user?.displayName} size="md" />
                <Text type="body-xs" color="muted" numberOfLines={1}>
                  {r.user?.displayName?.split(" ")[0] ?? "—"}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!cancelled && (
        <>
          <Text type="body-sm" weight="semibold" color="muted" className="mb-2 ml-1">
            Are you in?
          </Text>
          <RsvpPicker value={viewerStatus} onChange={onRsvp} />
        </>
      )}

      {/* Board */}
      <Text type="body-sm" weight="semibold" color="muted" className="mb-2 mt-7 ml-1">
        Board
      </Text>
      <View className="flex-row gap-2 mb-3 items-center">
        <View className="flex-1">
          <Input value={draft} onChangeText={setDraft} placeholder="Say something to the crew…" />
        </View>
        <Button variant="primary" size="md" isIconOnly onPress={post}>
          <Icon name="arrow-up" size={18} color="#FFFFFF" />
        </Button>
      </View>
      {(posts ?? []).map((p) => (
        <Card key={p._id} className="mb-2">
          <Card.Body className="flex-row gap-2.5 py-2.5">
            <UserAvatar name={p.author?.displayName} size="sm" />
            <View className="flex-1">
              <Text type="body-xs" weight="semibold" color="muted">
                {p.author?.displayName ?? "—"}
                {p.isAnnouncement ? " · announcement" : ""}
              </Text>
              <Text type="body-sm">{p.body}</Text>
            </View>
          </Card.Body>
        </Card>
      ))}

      {isOrganizer && !cancelled && (
        <View className="mt-7 gap-2">
          <Button
            variant="outline"
            size="md"
            onPress={() => router.push({ pathname: "/event/[id]/edit", params: { id: eventId } })}
          >
            <Icon name="create-outline" size={18} tint="foreground" />
            <Button.Label>Edit meetup</Button.Label>
          </Button>
          <Button variant="outline" size="md" onPress={share}>
            <Icon name="share-outline" size={18} tint="foreground" />
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
