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

function candidateSlots(now: number) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now + (i + 1) * DAY_MS);
    day.setHours(18, 0, 0, 0);
    const startsAt = day.getTime();
    return { startsAt, endsAt: startsAt + 2 * 60 * 60 * 1000 };
  });
}

// Direct event create (no poll). Invite-only by default (docs §3.4).
export default function NewEvent() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const create = useMutation(api.events.create);
  const slots = useMemo(() => candidateSlots(Date.now()), []);

  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [when, setWhen] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const valid = title.trim().length > 0 && when !== null;

  async function submit() {
    if (!currentUser || when === null) return;
    setBusy(true);
    try {
      const slot = slots.find((s) => s.startsAt === when)!;
      const eventId = await create({
        userId: currentUser._id,
        title: title.trim(),
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        customAddress: address.trim() || undefined,
        category: [],
        visibility: "invite_only",
        waitlistEnabled: false,
      });
      router.replace({ pathname: "/event/[id]", params: { id: eventId } });
    } catch (e) {
      Alert.alert("Couldn't create the event", String((e as Error).message));
      setBusy(false);
    }
  }

  return (
    <Screen title="New meetup">
      <Text className="text-brand-evergreen/65 text-[13px] mb-1.5 font-semibold">
        Title
      </Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Coffee at Karma ☕"
        placeholderTextColor="rgba(15,26,0,0.35)"
        maxLength={100}
        className="rounded-2xl bg-surface border border-brand-evergreen/15 px-4 py-3.5 text-[16px] text-brand-evergreen"
      />

      <Text className="text-brand-evergreen/65 text-[13px] mb-1.5 mt-5 font-semibold">
        Where
      </Text>
      <TextInput
        value={address}
        onChangeText={setAddress}
        placeholder="Krupnicza 12, Kraków"
        placeholderTextColor="rgba(15,26,0,0.35)"
        className="rounded-2xl bg-surface border border-brand-evergreen/15 px-4 py-3.5 text-[16px] text-brand-evergreen"
      />

      <Text className="text-brand-evergreen/65 text-[13px] mb-1.5 mt-5 font-semibold">
        When
      </Text>
      {slots.map((slot) => {
        const on = when === slot.startsAt;
        return (
          <Pressable
            key={slot.startsAt}
            onPress={() => setWhen(slot.startsAt)}
            className="mb-2 rounded-2xl border px-4 py-3"
            style={{
              backgroundColor: on ? "#5DA802" : "#FFFFFF",
              borderColor: on ? "#5DA802" : "rgba(15,26,0,0.12)",
            }}
          >
            <Text
              className="text-[15px] font-semibold"
              style={{ color: on ? "#FFFFFF" : "#0F1A00" }}
            >
              {formatDate(slot.startsAt)} · {formatRange(slot.startsAt, slot.endsAt)}
            </Text>
          </Pressable>
        );
      })}

      <View className="mt-4">
        <GradientButton
          label="Create meetup"
          onPress={submit}
          disabled={!valid}
          loading={busy}
        />
      </View>
    </Screen>
  );
}
