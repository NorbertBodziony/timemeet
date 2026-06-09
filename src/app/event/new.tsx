import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useMutation } from "convex/react";
import { Input, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { formatDate, formatDateTime, formatRange } from "../../lib/datetime";
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
  const [preview, setPreview] = useState(false);

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

  if (preview && when !== null) {
    return (
      <Screen title="Preview" subtitle="This is what your crew will see.">
        <View className="rounded-2xl bg-surface border border-border px-4 py-4 mb-6">
          <Text type="h2" weight="bold">
            {title.trim()}
          </Text>
          <Text color="muted" className="mt-2">
            {formatDateTime(when)}
          </Text>
          {!!address.trim() && (
            <Text type="body-sm" color="muted" className="mt-0.5">
              {address.trim()}
            </Text>
          )}
          <Text type="body-xs" color="muted" className="mt-2">
            Invite only · organized by {currentUser?.displayName ?? "you"}
          </Text>
        </View>
        <PrimaryButton label="Publish" onPress={submit} loading={busy} />
        <Pressable onPress={() => setPreview(false)} className="py-3 items-center mt-1">
          <Text weight="semibold" color="muted">
            Back to edit
          </Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen title="New meetup">
      <Text type="body-sm" weight="semibold" color="muted" className="mb-1.5">
        Title
      </Text>
      <Input value={title} onChangeText={setTitle} placeholder="Coffee at Karma ☕" maxLength={100} />

      <Text type="body-sm" weight="semibold" color="muted" className="mb-1.5 mt-5">
        Where
      </Text>
      <Input value={address} onChangeText={setAddress} placeholder="Krupnicza 12, Kraków" />

      <Text type="body-sm" weight="semibold" color="muted" className="mb-1.5 mt-5">
        When
      </Text>
      {slots.map((slot) => {
        const on = when === slot.startsAt;
        return (
          <Pressable
            key={slot.startsAt}
            onPress={() => setWhen(slot.startsAt)}
            className={`mb-2 rounded-2xl border px-4 py-3 ${
              on ? "bg-accent border-accent" : "bg-surface border-border"
            }`}
          >
            <Text weight="semibold" className={on ? "text-accent-foreground" : ""}>
              {formatDate(slot.startsAt)} · {formatRange(slot.startsAt, slot.endsAt)}
            </Text>
          </Pressable>
        );
      })}

      <View className="mt-4">
        <PrimaryButton label="Preview" onPress={() => setPreview(true)} disabled={!valid} />
      </View>
    </Screen>
  );
}
