import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Image, Pressable, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Button, Card, Input, ListGroup, Separator, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { FormLabel } from "../../components/FormLabel";
import { Icon } from "../../components/Icon";
import { PressableScale } from "../../components/PressableScale";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { UserAvatar } from "../../components/UserAvatar";
import { CATEGORIES, type CategoryKey } from "../../lib/categories";
import { formatDateTime } from "../../lib/datetime";
import { tap, warn } from "../../lib/haptics";
import { pickImages, uploadImage } from "../../lib/photos";
import { useAuth } from "../../providers/MockAuthProvider";
import { useCelebrate } from "../../providers/CelebrationProvider";
import { useT } from "../../providers/LanguageProvider";
import { errorMessage } from "../../lib/attempt";

const DAY_MS = 24 * 60 * 60 * 1000;



export default function NewEvent() {
  const router = useRouter();
  const { t } = useT();
  const { currentUser } = useAuth();
  const { celebrate } = useCelebrate();
  const create = useMutation(api.events.create);
  const inviteFriend = useMutation(api.friends.inviteFriend);
  const addItem = useMutation(api.items.add);
  const uploadUrlFor = useMutation(api.posts.generateUploadUrl);
  const friends = useQuery(
    api.friends.list,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  // Prefilled when re-running a past meetup ("Plan again").
  const params = useLocalSearchParams<{ title?: string; address?: string }>();

  const [title, setTitle] = useState(params.title ?? "");
  const [address, setAddress] = useState(params.address ?? "");
  const [description, setDescription] = useState("");
  const [when, setWhen] = useState<Date>(() => {
    const d = new Date(Date.now() + DAY_MS);
    d.setHours(18, 0, 0, 0);
    return d;
  });
  const [capacity, setCapacity] = useState("");
  const [minPeople, setMinPeople] = useState("");
  const [categories, setCategories] = useState<CategoryKey[]>([]);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [invitees, setInvitees] = useState<Id<"users">[]>([]);
  const [bring, setBring] = useState<string[]>([]);
  const [bringDraft, setBringDraft] = useState("");
  const [cover, setCover] = useState<{ id: string; uri: string } | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);

  async function pickCover() {
    if (!currentUser || coverBusy) return;
    tap();
    const uris = await pickImages();
    if (uris.length === 0) return;
    setCoverBusy(true);
    try {
      const url = await uploadUrlFor({ userId: currentUser._id });
      const id = await uploadImage(uris[0], url);
      setCover({ id, uri: uris[0] });
    } catch {
      warn();
      Alert.alert(t("errors.photoTitle"), t("errors.retryMoment"));
    } finally {
      setCoverBusy(false);
    }
  }

  const cap = capacity ? Math.max(1, parseInt(capacity, 10) || 0) : undefined;
  const minT = minPeople ? Math.max(1, parseInt(minPeople, 10) || 0) : undefined;

  const valid = title.trim().length > 0 && when.getTime() > Date.now();

  async function submit() {
    if (!currentUser) return;
    setBusy(true);
    try {
      const startsAt = when.getTime();
      const eventId = await create({
        userId: currentUser._id,
        title: title.trim(),
        startsAt,
        endsAt: startsAt + 2 * 60 * 60 * 1000,
        customAddress: address.trim() || undefined,
        description: description.trim() || undefined,
        coverImageId: cover ? (cover.id as never) : undefined,
        category: categories,
        visibility: "invite_only",
        waitlistEnabled: cap !== undefined,
        capacity: cap,
        minThreshold: minT,
      });
      // Invites + bring-list picked in the form go out right away — best-effort,
      // a failure here never blocks the freshly created meetup.
      await Promise.allSettled([
        ...invitees.map((friendId) =>
          inviteFriend({ userId: currentUser._id, eventId, friendId })
        ),
        ...bring.map((title) =>
          addItem({ userId: currentUser._id, eventId, title, claim: false })
        ),
      ]);
      celebrate(t("eventForm.created"));
      router.replace({ pathname: "/event/[id]", params: { id: eventId } });
    } catch (e) {
      warn();
      Alert.alert(t("errors.createEventTitle"), errorMessage(e));
      setBusy(false);
    }
  }

  if (preview) {
    return (
      <Screen title={t("eventForm.previewTitle")} subtitle={t("eventForm.previewSubtitle")} dismiss="close">
        <Card className="mb-6">
          {cover && (
            <Image
              source={{ uri: cover.uri }}
              className="w-full"
              style={{ aspectRatio: 16 / 9 }}
              resizeMode="cover"
            />
          )}
          <Card.Body className="gap-2">
            <Text type="h2" weight="bold">
              {title.trim()}
            </Text>
            <View className="flex-row items-center gap-2">
              <Icon name="calendar-outline" size={16} tint="accent" />
              <Text color="muted">{formatDateTime(when.getTime())}</Text>
            </View>
            {!!address.trim() && (
              <View className="flex-row items-center gap-2">
                <Icon name="location-outline" size={16} tint="muted" />
                <Text type="body-sm" color="muted">
                  {address.trim()}
                </Text>
              </View>
            )}
            {!!description.trim() && (
              <Text type="body-sm" color="muted">
                {description.trim()}
              </Text>
            )}
            <Text type="body-xs" color="muted" className="mt-1">
              {t("eventForm.inviteOnlyBy", { name: currentUser?.displayName ?? t("eventForm.you") })}
            </Text>
          </Card.Body>
        </Card>
        <PrimaryButton label={t("eventForm.publish")} onPress={submit} loading={busy} />
        <Pressable onPress={() => setPreview(false)} className="py-3 items-center mt-1">
          <Text weight="semibold" color="muted">
            {t("eventForm.backToEdit")}
          </Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen title={t("eventForm.title")} dismiss="close">
      <FormLabel>{t("eventForm.fieldTitle")}</FormLabel>
      <Input value={title} onChangeText={setTitle} placeholder={t("eventForm.titlePlaceholder")} maxLength={100} />

      <FormLabel className="mt-5">{t("eventForm.where")}</FormLabel>
      <Input value={address} onChangeText={setAddress} placeholder={t("eventForm.wherePlaceholder")} />

      <FormLabel className="mt-5">{t("eventForm.notes")}</FormLabel>
      <Input
        value={description}
        onChangeText={setDescription}
        placeholder={t("eventForm.notesPlaceholder")}
        multiline
        maxLength={1000}
      />

      {/* Bring-list seeded at creation — items land up for grabs. */}
      <FormLabel className="mt-5">{t("event.whatToBring")}</FormLabel>
      {bring.map((b, i) => (
        <View key={`${b}-${i}`} className="flex-row items-center gap-2 mb-2">
          <Icon name="ellipse-outline" size={18} tint="muted" />
          <Text className="flex-1">{b}</Text>
          <Pressable hitSlop={8} onPress={() => setBring(bring.filter((_, j) => j !== i))}>
            <Icon name="close" size={16} tint="muted" />
          </Pressable>
        </View>
      ))}
      <View className="flex-row gap-2 items-center">
        <View className="flex-1">
          <Input
            value={bringDraft}
            onChangeText={setBringDraft}
            placeholder={t("event.bringPlaceholder")}
            onSubmitEditing={() => {
              if (bringDraft.trim()) {
                setBring([...bring, bringDraft.trim()]);
                setBringDraft("");
              }
            }}
          />
        </View>
        <Button
          variant="outline"
          size="md"
          isIconOnly
          onPress={() => {
            if (!bringDraft.trim()) return;
            tap();
            setBring([...bring, bringDraft.trim()]);
            setBringDraft("");
          }}
        >
          <Icon name="add" size={18} tint="foreground" />
        </Button>
      </View>

      <FormLabel className="mt-5">{t("eventForm.cover")}</FormLabel>
      <Pressable onPress={pickCover}>
        {cover ? (
          <Image
            source={{ uri: cover.uri }}
            className="w-full rounded-2xl"
            style={{ aspectRatio: 16 / 9 }}
            resizeMode="cover"
          />
        ) : (
          <View className="rounded-2xl bg-surface border border-border items-center justify-center py-6">
            <Icon name={coverBusy ? "hourglass-outline" : "image-outline"} size={22} tint="muted" />
            <Text type="body-xs" color="muted" className="mt-1">
              {coverBusy ? t("eventForm.coverUploading") : t("eventForm.coverAdd")}
            </Text>
          </View>
        )}
      </Pressable>

      <FormLabel className="mt-5">{t("eventForm.when")}</FormLabel>
      <View className="rounded-2xl bg-surface px-3 py-2 flex-row items-center justify-between">
        <DateTimePicker
          value={when}
          mode="date"
          minimumDate={new Date()}
          onChange={(_, d) => d && setWhen((prev) => {
            const next = new Date(d);
            next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
            return next;
          })}
        />
        <DateTimePicker
          value={when}
          mode="time"
          minuteInterval={5}
          onChange={(_, d) => d && setWhen(d)}
        />
      </View>

      <FormLabel className="mt-5">{t("eventForm.category")}</FormLabel>
      <View className="flex-row flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const on = categories.includes(c.key);
          return (
            <PressableScale
              key={c.key}
              onPress={() =>
                setCategories(
                  on ? categories.filter((k) => k !== c.key) : [...categories, c.key]
                )
              }
              style={{ borderRadius: 999 }}
            >
              <View
                className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 border ${
                  on ? "bg-accent-soft border-accent-soft" : "bg-surface border-border"
                }`}
              >
                <Text>{c.emoji}</Text>
                <Text
                  type="body-sm"
                  weight="semibold"
                  className={on ? "text-accent-soft-foreground" : "text-foreground"}
                >
                  {t(c.labelKey)}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </View>

      {/* Optional anti-flake controls */}
      <View className="flex-row gap-3 mt-5">
        <View className="flex-1">
          <FormLabel>{t("eventForm.capacity")}</FormLabel>
          <Input
            value={capacity}
            onChangeText={setCapacity}
            placeholder={t("eventForm.capacityAny")}
            keyboardType="number-pad"
          />
        </View>
        <View className="flex-1">
          <FormLabel>{t("eventForm.minConfirm")}</FormLabel>
          <Input
            value={minPeople}
            onChangeText={setMinPeople}
            placeholder={t("eventForm.minNone")}
            keyboardType="number-pad"
          />
        </View>
      </View>
      <Text type="body-xs" color="muted" className="mt-1.5 ml-1">
        {t("eventForm.antiFlakeHint")}
      </Text>

      {/* Pick friends now — invites go out the moment the meetup is published. */}
      {!!friends && friends.length > 0 && (
        <>
          <FormLabel className="mt-5">{t("eventForm.inviteNow")}</FormLabel>
          <View className="flex-row flex-wrap gap-3">
            {friends.map((f) => {
              const on = invitees.includes(f._id);
              return (
                <Pressable
                  key={f._id}
                  onPress={() => {
                    tap();
                    setInvitees(
                      on ? invitees.filter((i) => i !== f._id) : [...invitees, f._id]
                    );
                  }}
                  className="items-center gap-1 w-16"
                  style={{ opacity: on ? 1 : 0.45 }}
                >
                  <View>
                    <UserAvatar name={f.displayName} photoUrl={f.photoUrl} size="md" />
                    {on && (
                      <View className="absolute -right-1 -bottom-1 rounded-full bg-background">
                        <Icon name="checkmark-circle" size={18} tint="success" />
                      </View>
                    )}
                  </View>
                  <Text type="body-xs" color={on ? "default" : "muted"} numberOfLines={1}>
                    {f.displayName.split(" ")[0]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {invitees.length > 0 && (
            <Text type="body-xs" color="muted" className="mt-1.5 ml-1">
              {t("eventForm.inviteNowHint")}
            </Text>
          )}
        </>
      )}

      <View className="mt-5">
        <PrimaryButton label={t("eventForm.preview")} onPress={() => setPreview(true)} disabled={!valid} />
      </View>
    </Screen>
  );
}
