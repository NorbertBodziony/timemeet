import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { GradientButton } from "../../components/GradientButton";
import { Screen } from "../../components/Screen";
import { formatDate, formatRange } from "../../lib/datetime";
import { MOCK_PLACES } from "../../lib/places";
import { useAuth } from "../../providers/MockAuthProvider";

const DAY_MS = 24 * 60 * 60 * 1000;
type PollType = "time" | "place";

// Candidate evening slots — next 7 days, 7–10pm. Pick 3–7 (docs §3.1).
function candidateSlots(now: number) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now + (i + 1) * DAY_MS);
    day.setHours(19, 0, 0, 0);
    const startsAt = day.getTime();
    return { startsAt, endsAt: startsAt + 3 * 60 * 60 * 1000 };
  });
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
              placeOptions: MOCK_PLACES.filter((p) =>
                pickedPlaces.has(p.placeId)
              ).map(({ multisport, ...p }) => p),
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
        {(["time", "place"] as PollType[]).map((t) => {
          const on = type === t;
          return (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              className="flex-1 items-center rounded-xl border py-2.5"
              style={{
                backgroundColor: on ? "#0F1A00" : "#FFFFFF",
                borderColor: on ? "#0F1A00" : "rgba(15,26,0,0.12)",
              }}
            >
              <Text
                className="text-[14px] font-semibold"
                style={{ color: on ? "#FAFFF2" : "rgba(15,26,0,0.7)" }}
              >
                {t === "time" ? "Time Poll" : "Place Poll"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="text-brand-evergreen/65 text-[13px] mb-1.5 font-semibold">
        What's the plan?
      </Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={type === "time" ? "Board game night 🎲" : "Saturday hangout"}
        placeholderTextColor="rgba(15,26,0,0.35)"
        maxLength={100}
        className="rounded-2xl bg-surface border border-brand-evergreen/15 px-4 py-3.5 text-[16px] text-brand-evergreen"
      />

      {type === "time" ? (
        <>
          <Text className="text-brand-evergreen/65 text-[13px] mb-1.5 mt-6 font-semibold">
            Pick 3–7 time slots ({pickedSlots.size} chosen)
          </Text>
          {slots.map((slot, i) => {
            const on = pickedSlots.has(i);
            return (
              <Pressable
                key={slot.startsAt}
                onPress={() => setPickedSlots((s) => toggle(s, i))}
                className="mb-2 flex-row items-center justify-between rounded-2xl border px-4 py-3.5"
                style={{
                  backgroundColor: on ? "#5DA802" : "#FFFFFF",
                  borderColor: on ? "#5DA802" : "rgba(15,26,0,0.12)",
                }}
              >
                <View>
                  <Text
                    className="text-[15px] font-semibold"
                    style={{ color: on ? "#FFFFFF" : "#0F1A00" }}
                  >
                    {formatDate(slot.startsAt)}
                  </Text>
                  <Text
                    className="text-[12px]"
                    style={{ color: on ? "rgba(255,255,255,0.85)" : "rgba(15,26,0,0.5)" }}
                  >
                    {formatRange(slot.startsAt, slot.endsAt)}
                  </Text>
                </View>
                <Text style={{ color: on ? "#FFFFFF" : "rgba(15,26,0,0.3)", fontSize: 18 }}>
                  {on ? "✓" : "+"}
                </Text>
              </Pressable>
            );
          })}
        </>
      ) : (
        <>
          <Text className="text-brand-evergreen/65 text-[13px] mb-1.5 mt-6 font-semibold">
            Pick 2+ places ({pickedPlaces.size} chosen)
          </Text>
          {MOCK_PLACES.map((p) => {
            const on = pickedPlaces.has(p.placeId);
            return (
              <Pressable
                key={p.placeId}
                onPress={() => setPickedPlaces((s) => toggle(s, p.placeId))}
                className="mb-2 flex-row items-center justify-between rounded-2xl border px-4 py-3.5"
                style={{
                  backgroundColor: on ? "#5DA802" : "#FFFFFF",
                  borderColor: on ? "#5DA802" : "rgba(15,26,0,0.12)",
                }}
              >
                <View className="flex-1 pr-2">
                  <Text
                    className="text-[15px] font-semibold"
                    style={{ color: on ? "#FFFFFF" : "#0F1A00" }}
                  >
                    {p.name}
                    {p.multisport ? "  ·  Multisport" : ""}
                  </Text>
                  <Text
                    className="text-[12px]"
                    style={{ color: on ? "rgba(255,255,255,0.85)" : "rgba(15,26,0,0.5)" }}
                  >
                    ★ {p.rating} ({p.reviewCount}) · {p.address}
                  </Text>
                </View>
                <Text style={{ color: on ? "#FFFFFF" : "rgba(15,26,0,0.3)", fontSize: 18 }}>
                  {on ? "✓" : "+"}
                </Text>
              </Pressable>
            );
          })}
        </>
      )}

      <View className="mt-4">
        <GradientButton
          label="Create poll"
          onPress={submit}
          disabled={!valid}
          loading={busy}
        />
      </View>
    </Screen>
  );
}
