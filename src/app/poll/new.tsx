import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useMutation } from "convex/react";
import { Button, Input, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { formatDate, formatRange } from "../../lib/datetime";
import { MOCK_PLACES } from "../../lib/places";
import { useAuth } from "../../providers/MockAuthProvider";

const DAY_MS = 24 * 60 * 60 * 1000;
type PollType = "time" | "place";

function candidateSlots(now: number) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now + (i + 1) * DAY_MS);
    day.setHours(19, 0, 0, 0);
    const startsAt = day.getTime();
    return { startsAt, endsAt: startsAt + 3 * 60 * 60 * 1000 };
  });
}

// A selectable option row (used for slots and venues).
function OptionRow({
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
    <Pressable
      onPress={onPress}
      className={`mb-2 flex-row items-center justify-between rounded-2xl border px-4 py-3.5 ${
        on ? "bg-accent border-accent" : "bg-surface border-border"
      }`}
    >
      <View className="flex-1 pr-2">
        <Text weight="semibold" className={on ? "text-accent-foreground" : ""}>
          {title}
        </Text>
        <Text type="body-xs" className={on ? "text-accent-foreground/80" : "text-muted"}>
          {subtitle}
        </Text>
      </View>
      <Text className={on ? "text-accent-foreground" : "text-muted"}>{on ? "✓" : "+"}</Text>
    </Pressable>
  );
}

export default function NewPoll() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const createPoll = useMutation(api.polls.create);
  const slots = useMemo(() => candidateSlots(Date.now()), []);

  const [type, setType] = useState<PollType>("time");
  const [title, setTitle] = useState("");
  const [pickedSlots, setPickedSlots] = useState<Set<number>>(new Set());
  const [pickedPlaces, setPickedPlaces] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const toggle = <T,>(set: Set<T>, key: T): Set<T> => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  };

  const count = type === "time" ? pickedSlots.size : pickedPlaces.size;
  const min = type === "time" ? 3 : 2;
  const valid =
    title.trim().length > 0 && count >= min && (type === "place" || count <= 7);

  async function submit() {
    if (!currentUser || !valid) return;
    setBusy(true);
    try {
      const pollId = await createPoll(
        type === "time"
          ? {
              userId: currentUser._id,
              type: "time",
              title: title.trim(),
              slots: [...pickedSlots].sort((a, b) => a - b).map((i) => slots[i]),
            }
          : {
              userId: currentUser._id,
              type: "place",
              title: title.trim(),
              placeOptions: MOCK_PLACES.filter((p) => pickedPlaces.has(p.placeId)).map(
                ({ multisport, ...p }) => p
              ),
            }
      );
      router.replace({ pathname: "/poll/[id]", params: { id: pollId } });
    } catch (e) {
      Alert.alert("Couldn't create the poll", String((e as Error).message));
      setBusy(false);
    }
  }

  return (
    <Screen
      title={type === "time" ? "When works?" : "Where to?"}
      subtitle={
        type === "time"
          ? "Drop some times. Crew taps. Done."
          : "Pick a few spots. Crew taps. Done."
      }
    >
      {/* Poll type toggle */}
      <View className="flex-row gap-2 mb-5 mt-1">
        {(["time", "place"] as PollType[]).map((t) => (
          <Button
            key={t}
            variant={type === t ? "primary" : "outline"}
            size="md"
            onPress={() => setType(t)}
            className="flex-1"
          >
            <Button.Label>{t === "time" ? "Time Poll" : "Place Poll"}</Button.Label>
          </Button>
        ))}
      </View>

      <Text type="body-sm" weight="semibold" color="muted" className="mb-1.5">
        What's the plan?
      </Text>
      <Input
        value={title}
        onChangeText={setTitle}
        placeholder={type === "time" ? "Board game night 🎲" : "Saturday hangout"}
        maxLength={100}
      />

      <Text type="body-sm" weight="semibold" color="muted" className="mb-1.5 mt-6">
        {type === "time"
          ? `Pick 3–7 time slots (${pickedSlots.size} chosen)`
          : `Pick 2+ places (${pickedPlaces.size} chosen)`}
      </Text>

      {type === "time"
        ? slots.map((slot, i) => (
            <OptionRow
              key={slot.startsAt}
              on={pickedSlots.has(i)}
              title={formatDate(slot.startsAt)}
              subtitle={formatRange(slot.startsAt, slot.endsAt)}
              onPress={() => setPickedSlots((s) => toggle(s, i))}
            />
          ))
        : MOCK_PLACES.map((p) => (
            <OptionRow
              key={p.placeId}
              on={pickedPlaces.has(p.placeId)}
              title={`${p.name}${p.multisport ? "  ·  Multisport" : ""}`}
              subtitle={`★ ${p.rating} (${p.reviewCount}) · ${p.address}`}
              onPress={() => setPickedPlaces((s) => toggle(s, p.placeId))}
            />
          ))}

      <View className="mt-4">
        <PrimaryButton label="Create poll" onPress={submit} disabled={!valid} loading={busy} />
      </View>
    </Screen>
  );
}
