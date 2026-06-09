import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useMutation } from "convex/react";
import { Card, Input, ListGroup, Separator, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { FormLabel } from "../../components/FormLabel";
import { Icon } from "../../components/Icon";
import { PressableScale } from "../../components/PressableScale";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { CATEGORIES, type CategoryKey } from "../../lib/categories";
import { formatDate, formatDateTime, formatRange } from "../../lib/datetime";
import { useAuth } from "../../providers/MockAuthProvider";
import { useCelebrate } from "../../providers/CelebrationProvider";
import { errorMessage } from "../../lib/attempt";

const DAY_MS = 24 * 60 * 60 * 1000;

function candidateSlots(now: number) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now + (i + 1) * DAY_MS);
    day.setHours(18, 0, 0, 0);
    const startsAt = day.getTime();
    return { startsAt, endsAt: startsAt + 2 * 60 * 60 * 1000 };
  });
}

export default function NewEvent() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { celebrate } = useCelebrate();
  const create = useMutation(api.events.create);
  const slots = useMemo(() => candidateSlots(Date.now()), []);
  // Prefilled when re-running a past meetup ("Plan again").
  const params = useLocalSearchParams<{ title?: string; address?: string }>();

  const [title, setTitle] = useState(params.title ?? "");
  const [address, setAddress] = useState(params.address ?? "");
  const [description, setDescription] = useState("");
  const [when, setWhen] = useState<number | null>(null);
  const [capacity, setCapacity] = useState("");
  const [minPeople, setMinPeople] = useState("");
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);

  const cap = capacity ? Math.max(1, parseInt(capacity, 10) || 0) : undefined;
  const minT = minPeople ? Math.max(1, parseInt(minPeople, 10) || 0) : undefined;

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
        description: description.trim() || undefined,
        category: category ? [category] : [],
        visibility: "invite_only",
        waitlistEnabled: cap !== undefined,
        capacity: cap,
        minThreshold: minT,
      });
      celebrate("Meetup created!");
      router.replace({ pathname: "/event/[id]", params: { id: eventId } });
    } catch (e) {
      Alert.alert("Couldn't create the event", errorMessage(e));
      setBusy(false);
    }
  }

  if (preview && when !== null) {
    return (
      <Screen title="Preview" subtitle="This is what your crew will see." dismiss="close">
        <Card className="mb-6">
          <Card.Body className="gap-2">
            <Text type="h2" weight="bold">
              {title.trim()}
            </Text>
            <View className="flex-row items-center gap-2">
              <Icon name="calendar-outline" size={16} tint="accent" />
              <Text color="muted">{formatDateTime(when)}</Text>
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
              Invite only · organized by {currentUser?.displayName ?? "you"}
            </Text>
          </Card.Body>
        </Card>
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
    <Screen title="New meetup" dismiss="close">
      <FormLabel>Title</FormLabel>
      <Input value={title} onChangeText={setTitle} placeholder="Coffee at Karma ☕" maxLength={100} />

      <FormLabel className="mt-5">Where</FormLabel>
      <Input value={address} onChangeText={setAddress} placeholder="Krupnicza 12, Kraków" />

      <FormLabel className="mt-5">Anything else?</FormLabel>
      <Input
        value={description}
        onChangeText={setDescription}
        placeholder="Bring a board game, dress warm…"
        multiline
        maxLength={1000}
      />

      <FormLabel className="mt-5">When</FormLabel>
      <ListGroup>
        {slots.map((slot, i) => {
          const on = when === slot.startsAt;
          return (
            <View key={slot.startsAt}>
              {i > 0 && <Separator className="ml-4" />}
              <ListGroup.Item onPress={() => setWhen(slot.startsAt)}>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{formatDate(slot.startsAt)}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>
                    {formatRange(slot.startsAt, slot.endsAt)}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                  {on ? (
                    <Icon name="checkmark-circle" size={22} tint="accent" />
                  ) : (
                    <View className="w-[22px]" />
                  )}
                </ListGroup.ItemSuffix>
              </ListGroup.Item>
            </View>
          );
        })}
      </ListGroup>

      <FormLabel className="mt-5">Category</FormLabel>
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
                  {c.label}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </View>

      {/* Optional anti-flake controls */}
      <View className="flex-row gap-3 mt-5">
        <View className="flex-1">
          <FormLabel>Capacity</FormLabel>
          <Input
            value={capacity}
            onChangeText={setCapacity}
            placeholder="Any"
            keyboardType="number-pad"
          />
        </View>
        <View className="flex-1">
          <FormLabel>Min to confirm</FormLabel>
          <Input
            value={minPeople}
            onChangeText={setMinPeople}
            placeholder="None"
            keyboardType="number-pad"
          />
        </View>
      </View>
      <Text type="body-xs" color="muted" className="mt-1.5 ml-1">
        Min auto-cancels if too few are in 2h before. Over capacity → waitlist.
      </Text>

      <View className="mt-5">
        <PrimaryButton label="Preview" onPress={() => setPreview(true)} disabled={!valid} />
      </View>
    </Screen>
  );
}
