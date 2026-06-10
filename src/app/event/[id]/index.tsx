import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, Share, View } from "react-native";
import * as ExpoLinking from "expo-linking";
import { useMutation, useQuery } from "convex/react";
import { Button, Card, Input, Separator, Spinner, Text } from "heroui-native";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Icon } from "../../../components/Icon";
import { Lutek } from "../../../components/Lutek";
import { Screen } from "../../../components/Screen";
import { RsvpPicker } from "../../../components/RsvpPicker";
import { SecondaryButton } from "../../../components/SecondaryButton";
import { SectionHeader } from "../../../components/SectionHeader";
import { StarRating } from "../../../components/StarRating";
import { UserAvatar } from "../../../components/UserAvatar";
import { formatDateTime } from "../../../lib/datetime";
import { attempt } from "../../../lib/attempt";
import { pickImages, uploadImage } from "../../../lib/photos";
import { success, tap } from "../../../lib/haptics";
import { addToCalendar } from "../../../lib/ics";
import { openMaps } from "../../../lib/maps";
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
  const items = useQuery(api.items.listForEvent, { eventId });
  const rating = useQuery(
    api.ratings.forEvent,
    currentUser ? { eventId, userId: currentUser._id } : { eventId }
  );
  const setRsvp = useMutation(api.rsvps.set);
  const addPost = useMutation(api.posts.add);
  const uploadUrl = useMutation(api.posts.generateUploadUrl);
  const cancelEvent = useMutation(api.events.cancel);
  const createToken = useMutation(api.invites.createToken);
  const setRating = useMutation(api.ratings.set);
  const addItem = useMutation(api.items.add);
  const toggleClaim = useMutation(api.items.toggleClaim);
  const removeItem = useMutation(api.items.remove);

  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState("");
  const [uploading, setUploading] = useState(false);

  // Initialize the note input from my existing rating once loaded.
  useEffect(() => {
    if (rating?.mine && note === null) setNote(rating.mine.note ?? "");
  }, [rating, note]);

  if (data === undefined) return <Screen title="Loading…" dismiss="back">{null}</Screen>;
  if (data === null)
    return <Screen title="Event not found" dismiss="back">{null}</Screen>;

  const { event, creator, counts, viewerStatus, coverUrl } = data;
  const isOrganizer = currentUser?._id === event.creatorId;
  const place = event.customAddress ?? event.placeId ?? "";
  const cancelled = event.status === "cancelled";
  const isPast = (event.endsAt ?? event.startsAt) < Date.now();
  const going = (rsvps ?? []).filter((r) => r.status === "going");
  const pending = (rsvps ?? []).filter((r) => r.status === "no_response");
  const myStars = rating?.mine?.stars ?? 0;

  async function onRsvp(status: RsvpStatus) {
    if (!currentUser) return;
    const ok = await attempt(() => setRsvp({ userId: currentUser._id, eventId, status }));
    if (!ok) return;
    if (status === "going") {
      success();
      push.push({ title: `You're in — ${event.title}` });
    }
  }

  async function rate(stars: number) {
    if (!currentUser) return;
    await attempt(() => setRating({ userId: currentUser._id, eventId, stars, note: note ?? undefined }));
  }

  async function saveNote() {
    if (!currentUser || !myStars) return;
    tap();
    await attempt(() => setRating({ userId: currentUser._id, eventId, stars: myStars, note: note ?? undefined }));
  }

  async function post() {
    if (!currentUser || !draft.trim()) return;
    tap();
    const ok = await attempt(() => addPost({ userId: currentUser._id, eventId, body: draft.trim(), isAnnouncement: isOrganizer }));
    if (ok) setDraft("");
  }

  async function addPhoto() {
    if (!currentUser || uploading) return;
    tap();
    const uris = await pickImages({ multiple: true });
    if (uris.length === 0) return;
    setUploading(true);
    try {
      const imageIds: string[] = [];
      for (const uri of uris) {
        const url = await uploadUrl({ userId: currentUser._id });
        imageIds.push(await uploadImage(uri, url));
      }
      await addPost({
        userId: currentUser._id,
        eventId,
        body: draft.trim(),
        isAnnouncement: false,
        imageIds: imageIds as never,
      });
      setDraft("");
    } catch {
      Alert.alert("Couldn't add those photos", "Give it another try in a moment.");
    } finally {
      setUploading(false);
    }
  }

  async function addBringItem() {
    if (!currentUser || !itemDraft.trim()) return;
    tap();
    const ok = await attempt(() => addItem({ userId: currentUser._id, eventId, title: itemDraft.trim() }));
    if (ok) setItemDraft("");
  }

  async function calendar() {
    try {
      await addToCalendar({
        title: event.title,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        location: place,
        description: event.description,
      });
    } catch {
      Alert.alert("Couldn't open calendar", "Try again in a moment.");
    }
  }

  async function share() {
    if (!currentUser) return;
    tap();
    const token = await createToken({ userId: currentUser._id, eventId });
    // Runtime-correct deep link (exp:// in Expo Go, meettime:// in builds).
    const url = ExpoLinking.createURL(`/invite/${token}`);
    try {
      await Share.share({ message: `Join me — ${event.title}\n${url}`, url });
    } catch {
      Alert.alert("Couldn't open share", url);
    }
  }

  function planAgain() {
    router.push({
      pathname: "/event/new",
      params: { title: event.title, address: place },
    });
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

      {!!coverUrl && (
        <Image
          source={{ uri: coverUrl }}
          className="w-full rounded-2xl mb-4"
          style={{ aspectRatio: 2.2 }}
          resizeMode="cover"
        />
      )}
      <Card className="mb-5">
        <Card.Body className="gap-2">
          <View className="flex-row items-center gap-2">
            <Icon
              name={isPast ? "checkmark-circle-outline" : "calendar-outline"}
              size={16}
              tint={isPast ? "muted" : "accent"}
            />
            <Text weight="semibold" color={isPast ? "muted" : "default"}>
              {isPast ? "Happened · " : ""}
              {formatDateTime(event.startsAt)}
            </Text>
          </View>
          {!!place && (
            <Pressable
              onPress={() => openMaps(place)}
              className="flex-row items-center gap-2"
              hitSlop={6}
            >
              <Icon name="location-outline" size={16} tint="muted" />
              <Text type="body-sm" color="muted" className="flex-1">
                {place}
              </Text>
              <Icon name="navigate-circle-outline" size={18} tint="accent" />
            </Pressable>
          )}
          {!!event.description && <Text type="body-sm" color="muted">{event.description}</Text>}
          <Separator className="my-1" />
          <View className="flex-row items-center gap-2">
            <UserAvatar name={creator?.displayName} photoUrl={creator?.photoUrl} size="sm" />
            <Text type="body-xs" color="muted">
              Organized by {creator?.displayName ?? "—"}
            </Text>
          </View>
        </Card.Body>
      </Card>

      {/* Attendees */}
      {going.length > 0 && (
        <View className="mb-5">
          <SectionHeader tight>
            {isPast ? "Who came" : `${counts.going} going · ${counts.maybe} maybe`}
          </SectionHeader>
          <View className="flex-row flex-wrap gap-3">
            {going.map((r) => (
              <View key={r._id} className="items-center gap-1 w-14">
                <UserAvatar name={r.user?.displayName} photoUrl={r.user?.photoUrl} size="md" />
                <Text type="body-xs" color="muted" numberOfLines={1}>
                  {r.user?.displayName?.split(" ")[0] ?? "—"}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* "Ekipa nie wie o planie" — organizer, upcoming, nobody invited yet (§V). */}
      {isOrganizer && !isPast && !cancelled && (rsvps ?? []).length === 0 && (
        <View className="my-3">
          <Lutek mood="waving" line="Your crew doesn't know yet — invite them below." size={52} />
        </View>
      )}

      {/* Organizer-only: who hasn't replied yet (docs §H). */}
      {isOrganizer && !isPast && !cancelled && pending.length > 0 && (
        <View className="mb-5">
          <SectionHeader tight>{`Waiting on ${pending.length}`}</SectionHeader>
          <View className="flex-row flex-wrap gap-3">
            {pending.map((r) => (
              <View key={r._id} className="items-center gap-1 w-14" style={{ opacity: 0.6 }}>
                <UserAvatar name={r.user?.displayName} photoUrl={r.user?.photoUrl} size="md" />
                <Text type="body-xs" color="muted" numberOfLines={1}>
                  {r.user?.displayName?.split(" ")[0] ?? "—"}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Past → rate; upcoming → RSVP */}
      {!cancelled && isPast && (
        <Card className="mb-2">
          <Card.Body className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text weight="semibold">How was it?</Text>
              {!!rating && rating.count > 0 && (
                <Text type="body-xs" color="muted">
                  {rating.average} ★ from {rating.count}
                </Text>
              )}
            </View>
            <StarRating value={myStars} onChange={rate} size={28} />
            <View className="flex-row gap-2 items-center">
              <View className="flex-1">
                <Input
                  value={note ?? ""}
                  onChangeText={setNote}
                  placeholder="Add a note (optional)"
                  editable={myStars > 0}
                />
              </View>
              <Button variant="outline" size="md" isDisabled={!myStars} onPress={saveNote}>
                <Button.Label>Save</Button.Label>
              </Button>
            </View>
          </Card.Body>
        </Card>
      )}

      {!cancelled && !isPast && (
        <>
          <Text type="body-sm" weight="semibold" color="muted" className="mb-2 ml-1">
            Are you in?
          </Text>
          <RsvpPicker value={viewerStatus} onChange={onRsvp} />
          <View className="flex-row gap-2.5 mt-3">
            <SecondaryButton
              className="flex-1"
              icon="person-add-outline"
              label="Invite friends"
              onPress={() =>
                router.push({ pathname: "/event/[id]/invite", params: { id: eventId } })
              }
            />
            <SecondaryButton
              className="flex-1"
              icon="calendar-outline"
              label="Add to calendar"
              onPress={calendar}
            />
          </View>
        </>
      )}

      {/* Bring-list / potluck — only on upcoming meetups. */}
      {!cancelled && !isPast && (
        <View>
          <SectionHeader>What to bring</SectionHeader>
          {(items ?? []).map((it) => {
            const mine = it.claimedBy === currentUser?._id;
            return (
              <Card key={it._id} className="mb-2">
                <Card.Body className="flex-row items-center gap-3 py-2.5">
                  <Pressable onPress={() => currentUser && attempt(() => toggleClaim({ userId: currentUser._id, itemId: it._id }))}>
                    <Icon
                      name={it.claimedBy ? "checkmark-circle" : "ellipse-outline"}
                      size={22}
                      tint={it.claimedBy ? "success" : "muted"}
                    />
                  </Pressable>
                  <View className="flex-1">
                    <Text weight="semibold">{it.title}</Text>
                    <Text type="body-xs" color="muted">
                      {it.claimer ? `${it.claimer.displayName.split(" ")[0]} has it` : "Up for grabs"}
                    </Text>
                  </View>
                  {it.claimedBy == null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => currentUser && attempt(() => toggleClaim({ userId: currentUser._id, itemId: it._id }))}
                    >
                      <Button.Label>I'll bring it</Button.Label>
                    </Button>
                  )}
                  {it.createdBy === currentUser?._id && (
                    <Pressable
                      hitSlop={8}
                      onPress={() => currentUser && attempt(() => removeItem({ userId: currentUser._id, itemId: it._id }))}
                    >
                      <Icon name="close" size={16} tint="muted" />
                    </Pressable>
                  )}
                  {mine && it.claimedBy != null && <View />}
                </Card.Body>
              </Card>
            );
          })}
          <View className="flex-row gap-2 items-center">
            <View className="flex-1">
              <Input
                value={itemDraft}
                onChangeText={setItemDraft}
                placeholder="Add something to bring…"
              />
            </View>
            <Button variant="outline" size="md" isIconOnly onPress={addBringItem}>
              <Icon name="add" size={18} tint="foreground" />
            </Button>
          </View>
        </View>
      )}

      {/* Board */}
      <SectionHeader>Board</SectionHeader>
      <View className="flex-row gap-2 mb-3 items-center">
        <View className="flex-1">
          <Input value={draft} onChangeText={setDraft} placeholder="Say something to the crew…" />
        </View>
        <Button variant="outline" size="md" isIconOnly onPress={addPhoto} isDisabled={uploading}>
          {uploading ? <Spinner size="sm" /> : <Icon name="image-outline" size={18} tint="foreground" />}
        </Button>
        <Button variant="primary" size="md" isIconOnly onPress={post}>
          <Icon name="arrow-up" size={18} color="#FFFFFF" />
        </Button>
      </View>
      {(posts ?? []).map((p) => (
        <Card key={p._id} className="mb-2">
          <Card.Body className="flex-row gap-2.5 py-2.5">
            <UserAvatar name={p.author?.displayName} photoUrl={p.author?.photoUrl} size="sm" />
            <View className="flex-1">
              <Text type="body-xs" weight="semibold" color="muted">
                {p.author?.displayName ?? "—"}
                {p.isAnnouncement ? " · announcement" : ""}
              </Text>
              {!!p.body && <Text type="body-sm">{p.body}</Text>}
              {p.imageUrls.length === 1 && (
                <Image
                  source={{ uri: p.imageUrls[0] }}
                  className="mt-2 rounded-xl w-full"
                  style={{ aspectRatio: 4 / 3 }}
                  resizeMode="cover"
                />
              )}
              {p.imageUrls.length > 1 && (
                <View className="mt-2 flex-row flex-wrap gap-1.5">
                  {p.imageUrls.map((u) => (
                    <Image
                      key={u}
                      source={{ uri: u }}
                      className="rounded-xl"
                      style={{ width: "48.5%", aspectRatio: 1 }}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              )}
            </View>
          </Card.Body>
        </Card>
      ))}

      {/* Past → plan again; upcoming organizer → edit/share/cancel */}
      {isPast && !cancelled && (
        <View className="mt-7">
          <Button variant="primary" size="lg" onPress={planAgain}>
            <Icon name="repeat" size={18} color="#FFFFFF" />
            <Button.Label>Plan again</Button.Label>
          </Button>
        </View>
      )}

      {isOrganizer && !isPast && !cancelled && (
        <View className="mt-8 gap-2.5">
          <SecondaryButton
            icon="create-outline"
            label="Edit meetup"
            onPress={() => router.push({ pathname: "/event/[id]/edit", params: { id: eventId } })}
          />
          <SecondaryButton icon="share-outline" label="Share invite link" onPress={share} />
          <Button variant="ghost" size="md" onPress={confirmCancel}>
            <Button.Label className="text-danger">Cancel meetup</Button.Label>
          </Button>
        </View>
      )}
    </Screen>
  );
}
