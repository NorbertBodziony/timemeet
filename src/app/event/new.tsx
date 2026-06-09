import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useMutation } from "convex/react";
import { Card, Input, ListGroup, Separator, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { Icon } from "../../components/Icon";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { formatDate, formatDateTime, formatRange } from "../../lib/datetime";
import { useAuth } from "../../providers/MockAuthProvider";
import { useCelebrate } from "../../providers/CelebrationProvider";

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
  const [when, setWhen] = useState<number | null>(null);
  const [capacity, setCapacity] = useState("");
  const [minPeople, setMinPeople] = useState("");
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
        category: [],
        visibility: "invite_only",
        waitlistEnabled: cap !== undefined,
        capacity: cap,
        minThreshold: minT,
      });
      celebrate("Meetup created!");
      router.replace({ pathname: "/event/[id]", params: { id: eventId } });
    } catch (e) {
      Alert.alert("Couldn't create the event", String((e as Error).message));
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

      {/* Optional anti-flake controls */}
      <View className="flex-row gap-3 mt-5">
        <View className="flex-1">
          <Text type="body-sm" weight="semibold" color="muted" className="mb-1.5">
            Capacity
          </Text>
          <Input
            value={capacity}
            onChangeText={setCapacity}
            placeholder="Any"
            keyboardType="number-pad"
          />
        </View>
        <View className="flex-1">
          <Text type="body-sm" weight="semibold" color="muted" className="mb-1.5">
            Min to confirm
          </Text>
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
