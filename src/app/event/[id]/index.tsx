import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
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
  useMemo(() => Date.now(), []);

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
    await addPost({
      userId: currentUser._id,
      eventId,
      body: draft.trim(),
      isAnnouncement: isOrganizer,
    });
    setDraft("");
  }

  async function share() {
    if (!currentUser) return;
    const token = await createToken({ userId: currentUser._id, eventId });
    Alert.alert("Share link (mock)", `meettime://invite/${token}`);
  }

  // Multi-step cancel (anti-flake) — confirm twice.
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
        <Text className="text-semantic-danger text-[13px] font-semibold mb-3">
          This meetup was cancelled.
        </Text>
      )}

      <View className="rounded-2xl bg-surface border border-brand-evergreen/10 px-4 py-3 mb-5">
        <Text className="text-brand-evergreen text-[15px] font-semibold">
          {formatDateTime(event.startsAt)}
        </Text>
        {!!place && (
          <Text className="text-brand-evergreen/65 text-[13px] mt-0.5">{place}</Text>
        )}
        {!!event.description && (
          <Text className="text-brand-evergreen/65 text-[13px] mt-2">
            {event.description}
          </Text>
        )}
        <Text className="text-rsvp-going text-[12px] font-semibold mt-2">
          {counts.going} going · {counts.maybe} maybe · {counts.waitlist} waitlist
        </Text>
        <Text className="text-brand-evergreen/40 text-[12px] mt-0.5">
          Organized by {creator?.displayName ?? "—"}
        </Text>
      </View>

      {!cancelled && (
        <>
          <Text className="text-brand-evergreen/65 text-[13px] mb-2 font-semibold">
            Are you in?
          </Text>
          <RsvpPicker value={viewerStatus} onChange={onRsvp} />
        </>
      )}

      {/* Board */}
      <Text className="text-brand-evergreen/65 text-[13px] mb-2 mt-7 font-semibold">
        Board
      </Text>
      <View className="flex-row gap-2 mb-3">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Say something to the crew…"
          placeholderTextColor="rgba(15,26,0,0.35)"
          className="flex-1 rounded-xl bg-surface border border-brand-evergreen/15 px-3 py-2.5 text-[14px] text-brand-evergreen"
        />
        <Pressable
          onPress={post}
          className="rounded-xl bg-brand-fern px-4 justify-center"
        >
          <Text className="text-ivory text-[14px] font-semibold">Send</Text>
        </Pressable>
      </View>
      {(posts ?? []).map((p) => (
        <View
          key={p._id}
          className="mb-2 rounded-xl bg-surface border border-brand-evergreen/10 px-3 py-2.5"
        >
          <Text className="text-brand-evergreen/45 text-[11px] font-semibold mb-0.5">
            {p.author?.displayName ?? "—"}
            {p.isAnnouncement ? " · announcement" : ""}
          </Text>
          <Text className="text-brand-evergreen text-[14px]">{p.body}</Text>
        </View>
      ))}

      {isOrganizer && !cancelled && (
        <View className="mt-7 gap-2">
          <Pressable
            onPress={() =>
              router.push({ pathname: "/event/[id]/edit", params: { id: eventId } })
            }
            className="rounded-xl border border-brand-evergreen/15 py-3 items-center"
          >
            <Text className="text-brand-evergreen text-[14px] font-semibold">
              Edit meetup
            </Text>
          </Pressable>
          <Pressable
            onPress={share}
            className="rounded-xl border border-brand-evergreen/15 py-3 items-center"
          >
            <Text className="text-brand-evergreen text-[14px] font-semibold">
              Share invite link
            </Text>
          </Pressable>
          <Pressable onPress={confirmCancel} className="py-3 items-center">
            <Text className="text-semantic-danger text-[14px] font-semibold">
              Cancel meetup
            </Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}
