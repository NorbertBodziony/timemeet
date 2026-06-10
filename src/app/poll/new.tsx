import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useMutation } from "convex/react";
import { Chip, Input, Tabs, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { FormLabel } from "../../components/FormLabel";
import { Icon } from "../../components/Icon";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SecondaryButton } from "../../components/SecondaryButton";
import { SurfaceCard } from "../../components/SurfaceCard";
import { formatDate, formatRange } from "../../lib/datetime";
import { MOCK_PLACES } from "../../lib/places";
import { tap, warn } from "../../lib/haptics";
import { useAuth } from "../../providers/MockAuthProvider";
import { errorMessage } from "../../lib/attempt";
import { useT } from "../../providers/LanguageProvider";

const HOUR_MS = 60 * 60 * 1000;
type PollType = "time" | "place" | "time_place";
type Slot = { startsAt: number; endsAt: number };
type Place = { placeId: string; name: string; address: string; lat: number; lng: number };

// Tomorrow at 19:00 — a sensible starting point for the picker.
function defaultWhen(): Date {
  const d = new Date(Date.now() + 24 * HOUR_MS);
  d.setHours(19, 0, 0, 0);
  return d;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function NewPoll() {
  const router = useRouter();
  const { t } = useT();
  const { currentUser } = useAuth();
  const createPoll = useMutation(api.polls.create);
  // Preselected by the creation chooser (/create).
  const params = useLocalSearchParams<{ type?: string }>();

  const [type, setType] = useState<PollType>(
    params.type === "place" || params.type === "time_place" ? params.type : "time"
  );
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  // Slots: built one by one from the date+time picker. Duration is +3h.
  const [slots, setSlots] = useState<Slot[]>([]);
  const [when, setWhen] = useState<Date>(defaultWhen);

  // Places: typed by hand (name + address); mock venues stay as suggestions.
  const [places, setPlaces] = useState<Place[]>([]);
  const [placeName, setPlaceName] = useState("");
  const [placeAddress, setPlaceAddress] = useState("");

  function addSlot() {
    const startsAt = when.getTime();
    if (slots.some((s) => s.startsAt === startsAt) || slots.length >= 7) return;
    tap();
    setSlots((prev) =>
      [...prev, { startsAt, endsAt: startsAt + 3 * HOUR_MS }].sort((a, b) => a.startsAt - b.startsAt)
    );
  }

  function addPlace(p: Place) {
    if (places.some((x) => x.placeId === p.placeId)) return;
    tap();
    setPlaces((prev) => [...prev, p]);
  }

  function addCustomPlace() {
    const name = placeName.trim();
    if (!name) return;
    // Keep ids unique even when two typed names slugify identically.
    let placeId = `custom_${slugify(name)}`;
    while (places.some((x) => x.placeId === placeId)) placeId += "_";
    addPlace({
      placeId,
      name,
      address: placeAddress.trim(),
      lat: 0,
      lng: 0,
    });
    setPlaceName("");
    setPlaceAddress("");
  }

  const wantsSlots = type !== "place";
  const wantsPlaces = type !== "time";
  const slotsOk = !wantsSlots || (slots.length >= 3 && slots.length <= 7);
  const placesOk = !wantsPlaces || places.length >= 2;
  const valid = title.trim().length > 0 && slotsOk && placesOk;

  async function submit() {
    if (!currentUser || !valid) return;
    setBusy(true);
    try {
      const pollId = await createPoll({
        userId: currentUser._id,
        type,
        title: title.trim(),
        slots: wantsSlots ? slots : undefined,
        placeOptions: wantsPlaces ? places : undefined,
      });
      router.replace({ pathname: "/poll/[id]", params: { id: pollId } });
    } catch (e) {
      warn();
      Alert.alert(t("errors.createPollTitle"), errorMessage(e));
      setBusy(false);
    }
  }

  const TITLES: Record<PollType, [string, string]> = {
    time: [t("pollForm.timeTitle"), t("pollForm.timeSubtitle")],
    place: [t("pollForm.placeTitle"), t("pollForm.placeSubtitle")],
    time_place: [t("pollForm.bothTitle"), t("pollForm.bothSubtitle")],
  };

  const suggestions = MOCK_PLACES.slice(0, 3).filter(
    (p) => !places.some((x) => x.placeId === p.placeId)
  );

  return (
    <Screen title={TITLES[type][0]} subtitle={TITLES[type][1]} dismiss="close">
      {/* Segmented poll-type control */}
      <Tabs value={type} onValueChange={(v) => setType(v as PollType)} className="mb-5 mt-1">
        <Tabs.List>
          <Tabs.Indicator />
          <Tabs.Trigger value="time">
            <Tabs.Label>{t("pollForm.tabTime")}</Tabs.Label>
          </Tabs.Trigger>
          <Tabs.Trigger value="place">
            <Tabs.Label>{t("pollForm.tabPlace")}</Tabs.Label>
          </Tabs.Trigger>
          <Tabs.Trigger value="time_place">
            <Tabs.Label>{t("pollForm.tabBoth")}</Tabs.Label>
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs>

      <FormLabel>{t("pollForm.whatsPlan")}</FormLabel>
      <Input
        value={title}
        onChangeText={setTitle}
        placeholder={t(type === "place" ? "pollForm.placePlaceholder" : "pollForm.timePlaceholder")}
        maxLength={100}
      />

      {wantsSlots && (
        <>
          <FormLabel className="mt-6">{t("pollForm.pickSlots", { count: slots.length })}</FormLabel>
          <View className="gap-2.5">
            {slots.map((slot) => (
              <SurfaceCard key={slot.startsAt} className="flex-row items-center gap-3">
                <Icon name="time-outline" size={18} tint="muted" />
                <View className="flex-1">
                  <Text weight="semibold">{formatDate(slot.startsAt)}</Text>
                  <Text type="body-xs" color="muted">
                    {formatRange(slot.startsAt, slot.endsAt)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    tap();
                    setSlots((prev) => prev.filter((s) => s.startsAt !== slot.startsAt));
                  }}
                  hitSlop={8}
                >
                  <Icon name="close" size={18} tint="muted" />
                </Pressable>
              </SurfaceCard>
            ))}

            {slots.length < 7 && (
              <>
                <View className="flex-row items-center bg-surface rounded-2xl px-2 py-1.5">
                  <DateTimePicker
                    value={when}
                    mode="date"
                    minimumDate={new Date()}
                    onChange={(_, d) =>
                      d &&
                      setWhen((prev) => {
                        const next = new Date(d);
                        next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
                        return next;
                      })
                    }
                  />
                  <DateTimePicker
                    value={when}
                    mode="time"
                    minuteInterval={5}
                    onChange={(_, d) => d && setWhen(d)}
                  />
                </View>
                <SecondaryButton label={t("pollForm.addSlot")} icon="add" onPress={addSlot} />
              </>
            )}
          </View>
        </>
      )}

      {wantsPlaces && (
        <>
          <FormLabel className="mt-6">{t("pollForm.pickPlaces", { count: places.length })}</FormLabel>
          <View className="gap-2.5">
            {places.map((p) => (
              <SurfaceCard key={p.placeId} className="flex-row items-center gap-3">
                <Icon name="location-outline" size={18} tint="muted" />
                <View className="flex-1">
                  <Text weight="semibold">{p.name}</Text>
                  {!!p.address && (
                    <Text type="body-xs" color="muted">
                      {p.address}
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={() => {
                    tap();
                    setPlaces((prev) => prev.filter((x) => x.placeId !== p.placeId));
                  }}
                  hitSlop={8}
                >
                  <Icon name="close" size={18} tint="muted" />
                </Pressable>
              </SurfaceCard>
            ))}

            <Input
              value={placeName}
              onChangeText={setPlaceName}
              placeholder={t("pollForm.placeName")}
            />
            <Input
              value={placeAddress}
              onChangeText={setPlaceAddress}
              placeholder={t("pollForm.placeAddress")}
            />
            <SecondaryButton label={t("pollForm.addPlace")} icon="add" onPress={addCustomPlace} />

            {suggestions.length > 0 && (
              <>
                <Text type="body-xs" color="muted" className="mt-1">
                  {t("pollForm.suggestions")}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {suggestions.map((p) => (
                    <Chip
                      key={p.placeId}
                      color="default"
                      variant="soft"
                      size="sm"
                      onPress={() =>
                        addPlace({
                          placeId: p.placeId,
                          name: p.name,
                          address: p.address,
                          lat: p.lat,
                          lng: p.lng,
                        })
                      }
                    >
                      <Chip.Label>{p.name}</Chip.Label>
                    </Chip>
                  ))}
                </View>
              </>
            )}
          </View>
        </>
      )}

      <View className="mt-5">
        <PrimaryButton label={t("pollForm.create")} onPress={submit} disabled={!valid} loading={busy} />
      </View>
    </Screen>
  );
}
