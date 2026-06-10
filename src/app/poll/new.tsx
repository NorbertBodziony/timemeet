import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { useMutation } from "convex/react";
import { Input, ListGroup, Separator, Tabs, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { FormLabel } from "../../components/FormLabel";
import { Icon } from "../../components/Icon";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { formatDate, formatRange } from "../../lib/datetime";
import { MOCK_PLACES } from "../../lib/places";
import { tap, warn } from "../../lib/haptics";
import { useAuth } from "../../providers/MockAuthProvider";
import { errorMessage } from "../../lib/attempt";
import { useT } from "../../providers/LanguageProvider";

const DAY_MS = 24 * 60 * 60 * 1000;
type PollType = "time" | "place" | "time_place";

function candidateSlots(now: number) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now + (i + 1) * DAY_MS);
    day.setHours(19, 0, 0, 0);
    const startsAt = day.getTime();
    return { startsAt, endsAt: startsAt + 3 * 60 * 60 * 1000 };
  });
}

function SelectRow({
  on,
  title,
  subtitle,
  onPress,
}: {
  on: boolean;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <ListGroup.Item
      onPress={() => {
        tap();
        onPress();
      }}
    >
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
        <ListGroup.ItemDescription>{subtitle}</ListGroup.ItemDescription>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>
        {on ? <Icon name="checkmark-circle" size={22} tint="accent" /> : <View className="w-[22px]" />}
      </ListGroup.ItemSuffix>
    </ListGroup.Item>
  );
}

export default function NewPoll() {
  const router = useRouter();
  const { t } = useT();
  const { currentUser } = useAuth();
  const createPoll = useMutation(api.polls.create);
  const slots = useMemo(() => candidateSlots(Date.now()), []);
  // Preselected by the creation chooser (/create).
  const params = useLocalSearchParams<{ type?: string }>();

  const [type, setType] = useState<PollType>(
    params.type === "place" || params.type === "time_place" ? params.type : "time"
  );
  const [title, setTitle] = useState("");
  const [pickedSlots, setPickedSlots] = useState<Set<number>>(new Set());
  const [pickedPlaces, setPickedPlaces] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const toggle = <T,>(set: Set<T>, key: T): Set<T> => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  };

  const wantsSlots = type !== "place";
  const wantsPlaces = type !== "time";
  const slotsOk = !wantsSlots || (pickedSlots.size >= 3 && pickedSlots.size <= 7);
  const placesOk = !wantsPlaces || pickedPlaces.size >= 2;
  const valid = title.trim().length > 0 && slotsOk && placesOk;

  async function submit() {
    if (!currentUser || !valid) return;
    setBusy(true);
    try {
      const pollId = await createPoll({
        userId: currentUser._id,
        type,
        title: title.trim(),
        slots: wantsSlots
          ? [...pickedSlots].sort((a, b) => a - b).map((i) => slots[i])
          : undefined,
        placeOptions: wantsPlaces
          ? MOCK_PLACES.filter((p) => pickedPlaces.has(p.placeId)).map(
              ({ multisport, ...p }) => p
            )
          : undefined,
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
          <FormLabel className="mt-6">{t("pollForm.pickSlots", { count: pickedSlots.size })}</FormLabel>
          <ListGroup>
            {slots.map((slot, i) => (
              <View key={slot.startsAt}>
                {i > 0 && <Separator className="ml-4" />}
                <SelectRow
                  on={pickedSlots.has(i)}
                  title={formatDate(slot.startsAt)}
                  subtitle={formatRange(slot.startsAt, slot.endsAt)}
                  onPress={() => setPickedSlots((s) => toggle(s, i))}
                />
              </View>
            ))}
          </ListGroup>
        </>
      )}

      {wantsPlaces && (
        <>
          <FormLabel className="mt-6">{t("pollForm.pickPlaces", { count: pickedPlaces.size })}</FormLabel>
          <ListGroup>
            {MOCK_PLACES.map((p, i) => (
              <View key={p.placeId}>
                {i > 0 && <Separator className="ml-4" />}
                <SelectRow
                  on={pickedPlaces.has(p.placeId)}
                  title={`${p.name}${p.multisport ? "  ·  Multisport" : ""}`}
                  subtitle={`★ ${p.rating} (${p.reviewCount}) · ${p.address}`}
                  onPress={() => setPickedPlaces((s) => toggle(s, p.placeId))}
                />
              </View>
            ))}
          </ListGroup>
        </>
      )}

      <View className="mt-5">
        <PrimaryButton label={t("pollForm.create")} onPress={submit} disabled={!valid} loading={busy} />
      </View>
    </Screen>
  );
}
