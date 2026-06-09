import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { GradientButton } from "../../components/GradientButton";
import { Screen } from "../../components/Screen";
import { formatDate, formatRange } from "../../lib/datetime";
import { useAuth } from "../../providers/MockAuthProvider";

const DAY_MS = 24 * 60 * 60 * 1000;

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

  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  const toggle = (i: number) =>
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const valid = title.trim().length > 0 && picked.size >= 3 && picked.size <= 7;

  async function submit() {
    if (!currentUser || !valid) return;
    setBusy(true);
    try {
      const chosen = [...picked].sort((a, b) => a - b).map((i) => slots[i]);
      const pollId = await createPoll({
        userId: currentUser._id,
        type: "time",
        title: title.trim(),
        slots: chosen,
      });
      router.replace({ pathname: "/poll/[id]", params: { id: pollId } });
    } catch (e) {
      Alert.alert("Couldn't create the poll", String((e as Error).message));
      setBusy(false);
    }
  }

  return (
    <Screen title="When works?" subtitle="Drop some times. Crew taps. Done.">
      <Text className="text-brand-evergreen/65 text-[13px] mb-1.5 mt-2 font-semibold">
        What's the plan?
      </Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Board game night 🎲"
        placeholderTextColor="rgba(15,26,0,0.35)"
        maxLength={100}
        className="rounded-2xl bg-surface border border-brand-evergreen/15 px-4 py-3.5 text-[16px] text-brand-evergreen"
      />

      <Text className="text-brand-evergreen/65 text-[13px] mb-1.5 mt-6 font-semibold">
        Pick 3–7 time slots ({picked.size} chosen)
      </Text>
      {slots.map((slot, i) => {
        const on = picked.has(i);
        return (
          <Pressable
            key={slot.startsAt}
            onPress={() => toggle(i)}
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
