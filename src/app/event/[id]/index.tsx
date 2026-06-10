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
import { SurfaceCard } from "../../../components/SurfaceCard";
import { StarRating } from "../../../components/StarRating";
import { UserAvatar } from "../../../components/UserAvatar";
import { formatDateTime } from "../../../lib/datetime";
import { attempt } from "../../../lib/attempt";
import { success, tap } from "../../../lib/haptics";
import { addToCalendar } from "../../../lib/calendar";
import { openMaps } from "../../../lib/maps";
import { type RsvpStatus } from "../../../lib/theme";
import { useAuth } from "../../../providers/MockAuthProvider";
import { usePush } from "../../../providers/MockPushProvider";
import { useT } from "../../../providers/LanguageProvider";

export default function EventDetail() {
  const router = useRouter();
  const { t } = useT();
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
  const cancelEvent = useMutation(api.events.cancel);
  const createToken = useMutation(api.invites.createToken);
  const setRating = useMutation(api.ratings.set);
  const addItem = useMutation(api.items.add);
  const toggleClaim = useMutation(api.items.toggleClaim);
  const removeItem = useMutation(api.items.remove);

  const [note, setNote] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  // Initialize the note input from my existing rating once loaded.
  useEffect(() => {
    if (rating?.mine && note === null) setNote(rating.mine.note ?? "");
  }, [rating, note]);

  if (data === undefined) return <Screen title={t("common.loading")} dismiss="back">{null}</Screen>;
  if (data === null)
    return <Screen title={t("common.eventNotFound")} dismiss="back">{null}</Screen>;

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
      push.push({ title: t("event.youreIn", { title: event.title }) });
    }
  }

  async function rate(stars: number) {
    if (!currentUser) return;
    await attempt(() => setRating({ userId: currentUser._id, eventId, stars, note: note ?? undefined }));
  }

  async function saveNote() {
    if (!currentUser || !myStars) return;
    const ok = await attempt(() =>
      setRating({ userId: currentUser._id, eventId, stars: myStars, note: note ?? undefined })
    );
    if (ok) {
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
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
      Alert.alert(t("errors.calendarTitle"), t("errors.tryAgainMoment"));
    }
  }

  async function share() {
    if (!currentUser) return;
    tap();
    const token = await createToken({ userId: currentUser._id, eventId });
    // Runtime-correct deep link (exp:// in Expo Go, meettime:// in builds).
    const url = ExpoLinking.createURL(`/invite/${token}`);
    try {
      await Share.share({ message: t("event.shareMessage", { title: event.title, url }), url });
    } catch {
      Alert.alert(t("errors.shareTitle"), url);
    }
  }

  function planAgain() {
    router.push({
      pathname: "/event/new",
      params: { title: event.title, address: place },
    });
  }

  function confirmCancel() {
    Alert.alert(t("event.cancelQ"), t("event.cancelBody"), [
      { text: t("event.keepIt"), style: "cancel" },
      {
        text: t("event.continue"),
        style: "destructive",
        onPress: () =>
          Alert.alert(t("event.sureQ"), t("event.sureBody"), [
            { text: t("event.keepIt"), style: "cancel" },
            {
              text: t("event.yesCancel"),
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
            {t("event.cancelledBanner")}
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
              {isPast ? t("event.happened") : ""}
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
              {t("event.organizedBy", { name: creator?.displayName ?? "—" })}
            </Text>
          </View>
        </Card.Body>
      </Card>

      {/* Attendees */}
      {going.length > 0 && (
        <View className="mb-5">
          <Pressable
            onPress={() =>
              router.push({ pathname: "/event/[id]/guests" as never, params: { id: eventId } })
            }
            className="flex-row items-center gap-1"
          >
            <SectionHeader tight>
              {isPast ? t("event.whoCame") : t("event.goingMaybe", { going: counts.going, maybe: counts.maybe })}
            </SectionHeader>
            <Icon name="chevron-forward" size={13} tint="muted" />
          </Pressable>
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
          <Lutek mood="waving" line={t("event.crewDoesntKnow")} size={52} />
        </View>
      )}

      {/* Organizer-only: who hasn't replied yet (docs §H). */}
      {isOrganizer && !isPast && !cancelled && pending.length > 0 && (
        <View className="mb-5">
          <SectionHeader tight>{t("event.waitingOn", { count: pending.length })}</SectionHeader>
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
              <Text weight="semibold">{t("event.howWasIt")}</Text>
              {!!rating && rating.count > 0 && (
                <Text type="body-xs" color="muted">
                  {t("event.ratingFrom", { avg: rating.average, count: rating.count })}
                </Text>
              )}
            </View>
            <StarRating value={myStars} onChange={rate} size={28} />
            <Input
              value={note ?? ""}
              onChangeText={setNote}
              placeholder={t("event.notePlaceholder")}
              editable={myStars > 0}
              onEndEditing={saveNote}
            />
            {noteSaved && (
              <Text type="body-xs" color="muted">
                {t("event.noteSaved")}
              </Text>
            )}
          </Card.Body>
        </Card>
      )}

      {!cancelled && !isPast && (
        <>
          <Text type="body-sm" weight="semibold" color="muted" className="mb-2 ml-1">
            {t("event.areYouIn")}
          </Text>
          <RsvpPicker value={viewerStatus} onChange={onRsvp} />
          <View className="flex-row gap-2.5 mt-3">
            <SecondaryButton
              className="flex-1"
              icon="person-add-outline"
              label={t("event.inviteFriends")}
              onPress={() =>
                router.push({ pathname: "/event/[id]/invite", params: { id: eventId } })
              }
            />
            <SecondaryButton
              className="flex-1"
              icon="calendar-outline"
              label={t("event.addToCalendar")}
              onPress={calendar}
            />
          </View>
        </>
      )}

      {/* Bring-list / potluck — only on upcoming meetups. */}
      {!cancelled && !isPast && (
        <View>
          <SectionHeader>{t("event.whatToBring")}</SectionHeader>
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
                      {it.claimer ? t("event.hasIt", { name: it.claimer.displayName.split(" ")[0] }) : t("event.upForGrabs")}
                    </Text>
                  </View>
                  {it.claimedBy == null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => currentUser && attempt(() => toggleClaim({ userId: currentUser._id, itemId: it._id }))}
                    >
                      <Button.Label>{t("event.illBringIt")}</Button.Label>
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
                placeholder={t("event.bringPlaceholder")}
              />
            </View>
            <Button variant="outline" size="md" isIconOnly onPress={addBringItem}>
              <Icon name="add" size={18} tint="foreground" />
            </Button>
          </View>
        </View>
      )}

      {/* Board — its own page; show a one-row preview here. */}
      <SectionHeader>{t("event.board")}</SectionHeader>
      <SurfaceCard
        className="flex-row items-center gap-3"
        onPress={() =>
          router.push({ pathname: "/event/[id]/board" as never, params: { id: eventId } })
        }
      >
        <Icon name="chatbubble-outline" size={20} tint="accent" />
        <View className="flex-1">
          {posts && posts.length > 0 ? (
            <>
              <Text type="body-sm" weight="semibold" numberOfLines={1}>
                {posts[0].author?.displayName ?? "—"}
                {": "}
                {posts[0].body || "📷"}
              </Text>
              <Text type="body-xs" color="muted">
                {posts.length === 1
                  ? t("event.boardOne")
                  : t("event.boardCount", { count: posts.length })}
              </Text>
            </>
          ) : (
            <Text type="body-sm" color="muted">
              {t("event.boardEmptyHint")}
            </Text>
          )}
        </View>
        <Icon name="chevron-forward" size={16} tint="muted" />
      </SurfaceCard>

      {/* Past → plan again; upcoming organizer → edit/share/cancel */}
      {isPast && !cancelled && (
        <View className="mt-7">
          <Button variant="primary" size="lg" onPress={planAgain}>
            <Icon name="repeat" size={18} color="#FFFFFF" />
            <Button.Label>{t("event.planAgain")}</Button.Label>
          </Button>
        </View>
      )}

      {isOrganizer && !isPast && !cancelled && (
        <View className="mt-8 gap-2.5">
          <SecondaryButton
            icon="create-outline"
            label={t("event.editMeetup")}
            onPress={() => router.push({ pathname: "/event/[id]/edit", params: { id: eventId } })}
          />
          <SecondaryButton icon="share-outline" label={t("event.shareInvite")} onPress={share} />
          <Button variant="ghost" size="md" onPress={confirmCancel}>
            <Button.Label className="text-danger">{t("event.cancelMeetup")}</Button.Label>
          </Button>
        </View>
      )}
    </Screen>
  );
}
