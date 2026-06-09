import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Input, Text } from "heroui-native";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { PrimaryButton } from "../../../components/PrimaryButton";
import { Screen } from "../../../components/Screen";
import { formatDateTime } from "../../../lib/datetime";
import { useAuth } from "../../../providers/MockAuthProvider";
import { usePush } from "../../../providers/MockPushProvider";

const DAY_MS = 24 * 60 * 60 * 1000;

function candidateSlots(now: number) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now + (i + 1) * DAY_MS);
    day.setHours(18, 0, 0, 0);
    return day.getTime();
  });
}

export default function EditEvent() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id as Id<"events">;
  const { currentUser } = useAuth();
  const push = usePush();

  const data = useQuery(api.events.get, { eventId });
  const edit = useMutation(api.events.edit);
  const slots = useMemo(() => candidateSlots(Date.now()), []);

  const [title, setTitle] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  if (data === undefined) return <Screen title="Loading…">{null}</Screen>;
  if (data === null) return <Screen title="Event not found">{null}</Screen>;
  const { event } = data;

  const curTitle = title ?? event.title;
  const curAddress = address ?? event.customAddress ?? "";
  const curDesc = description ?? event.description ?? "";
  const curStart = startsAt ?? event.startsAt;

  const changes: { label: string; from: string; to: string }[] = [];
  if (curTitle !== event.title) changes.push({ label: "Title", from: event.title, to: curTitle });
  if (curAddress !== (event.customAddress ?? ""))
    changes.push({ label: "Where", from: event.customAddress ?? "—", to: curAddress || "—" });
  if (curDesc !== (event.description ?? ""))
    changes.push({ label: "Notes", from: event.description ?? "—", to: curDesc || "—" });
  if (curStart !== event.startsAt)
    changes.push({ label: "When", from: formatDateTime(event.startsAt), to: formatDateTime(curStart) });

  async function save() {
    if (!currentUser || changes.length === 0) return;
    setBusy(true);
    try {
      await edit({
        userId: currentUser._id,
        eventId,
        patch: {
          title: curTitle,
          customAddress: curAddress || undefined,
          description: curDesc || undefined,
          startsAt: curStart,
        },
      });
      push.push({ title: `Updated: ${curTitle}` });
      router.back();
    } catch (e) {
      Alert.alert("Couldn't save", String((e as Error).message));
      setBusy(false);
    }
  }

  const fieldLabel = "mb-1.5";

  return (
    <Screen title="Edit meetup">
      <Text type="body-sm" weight="semibold" color="muted" className={fieldLabel}>
        Title
      </Text>
      <Input value={curTitle} onChangeText={setTitle} maxLength={100} />

      <Text type="body-sm" weight="semibold" color="muted" className="mb-1.5 mt-5">
        Where
      </Text>
      <Input value={curAddress} onChangeText={setAddress} placeholder="Address" />

      <Text type="body-sm" weight="semibold" color="muted" className="mb-1.5 mt-5">
        Notes
      </Text>
      <Input value={curDesc} onChangeText={setDescription} placeholder="Optional" multiline />

      <Text type="body-sm" weight="semibold" color="muted" className="mb-1.5 mt-5">
        When
      </Text>
      {slots.map((s) => {
        const on = curStart === s;
        return (
          <Pressable
            key={s}
            onPress={() => setStartsAt(s)}
            className={`mb-2 rounded-2xl border px-4 py-3 ${
              on ? "bg-accent border-accent" : "bg-surface border-border"
            }`}
          >
            <Text weight="semibold" className={on ? "text-accent-foreground" : ""}>
              {formatDateTime(s)}
            </Text>
          </Pressable>
        );
      })}

      {changes.length > 0 && (
        <View className="rounded-2xl bg-surface border border-border px-4 py-3 mt-4 mb-4">
          <Text type="body-xs" weight="semibold" color="muted" className="mb-2">
            CHANGES
          </Text>
          {changes.map((c) => (
            <Text key={c.label} type="body-sm" color="muted" className="mb-1">
              {c.label}: {c.from} → <Text type="body-sm" weight="semibold">{c.to}</Text>
            </Text>
          ))}
        </View>
      )}

      <PrimaryButton label="Save changes" onPress={save} disabled={changes.length === 0} loading={busy} />
    </Screen>
  );
}
