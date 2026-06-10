import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Image, Pressable, View } from "react-native";
import { useMutation } from "convex/react";
import { Card, Input, ListGroup, Separator, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { FormLabel } from "../../components/FormLabel";
import { Icon } from "../../components/Icon";
import { PressableScale } from "../../components/PressableScale";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
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
  const uploadUrlFor = useMutation(api.posts.generateUploadUrl);
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
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
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
        category: category ? [category] : [],
        visibility: "invite_only",
        waitlistEnabled: cap !== undefined,
        capacity: cap,
        minThreshold: minT,
      });
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
              style={{ aspectRatio: 2.2 }}
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

      <FormLabel className="mt-5">{t("eventForm.cover")}</FormLabel>
      <Pressable onPress={pickCover}>
        {cover ? (
          <Image
            source={{ uri: cover.uri }}
            className="w-full rounded-2xl"
            style={{ aspectRatio: 2.2 }}
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
          const on = category === c.key;
          return (
            <PressableScale
              key={c.key}
              onPress={() => setCategory(on ? null : c.key)}
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

      <View className="mt-5">
        <PrimaryButton label={t("eventForm.preview")} onPress={() => setPreview(true)} disabled={!valid} />
      </View>
    </Screen>
  );
}
