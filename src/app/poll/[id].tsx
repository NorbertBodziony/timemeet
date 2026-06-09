import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Chip, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { formatDate, formatRange } from "../../lib/datetime";
import { useAuth } from "../../providers/MockAuthProvider";
import { usePush } from "../../providers/MockPushProvider";

type Vote = "yes" | "maybe" | "no";
const VOTES: { value: Vote; label: string; color: "success" | "warning" | "default" }[] = [
  { value: "yes", label: "Yes", color: "success" },
  { value: "maybe", label: "Maybe", color: "warning" },
  { value: "no", label: "No", color: "default" },
];

function VoteRow({
  title,
  subtitle,
  counts,
  mine,
  highlight,
  disabled,
  onVote,
}: {
  title: string;
  subtitle: string;
  counts: { yes: number; maybe: number; no: number };
  mine?: Vote;
  highlight?: boolean;
  disabled?: boolean;
  onVote: (value: Vote) => void;
}) {
  return (
    <View
      className={`mb-3 rounded-2xl bg-surface border px-4 py-3 ${
        highlight ? "border-success" : "border-border"
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text weight="bold">{title}</Text>
          <Text type="body-xs" color="muted">
            {subtitle}
          </Text>
        </View>
        <Text type="body-xs" weight="semibold" className="text-success">
          {counts.yes} yes{counts.maybe ? ` · ${counts.maybe} maybe` : ""}
        </Text>
      </View>
      {!disabled && (
        <View className="flex-row gap-2 mt-3">
          {VOTES.map((v) => (
            <Chip
              key={v.value}
              color={v.color}
              variant={mine === v.value ? "primary" : "tertiary"}
              size="md"
              onPress={() => onVote(v.value)}
              className="flex-1 justify-center"
            >
              <Chip.Label>{v.label}</Chip.Label>
            </Chip>
          ))}
        </View>
      )}
    </View>
  );
}

export default function PollDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pollId = id as Id<"polls">;
  const { currentUser } = useAuth();
  const push = usePush();

  const data = useQuery(
    api.polls.get,
    currentUser ? { pollId, userId: currentUser._id } : { pollId }
  );
  const agg = useQuery(api.polls.aggregate, { pollId });
  const castVote = useMutation(api.polls.vote);
  const convert = useMutation(api.polls.convertToEvent);

  if (data === undefined) return <Screen title="Loading…">{null}</Screen>;
  if (data === null) return <Screen title="Poll not found">{null}</Screen>;

  const { poll, slots, placeOptions, myVotes } = data;
  const isOrganizer = currentUser?._id === poll.creatorId;
  const converted = poll.status === "converted";
  const isPlace = poll.type === "place";
  const countsFor = (key: string) => agg?.[key] ?? { yes: 0, maybe: 0, no: 0 };

  const leader = isPlace
    ? null
    : slots.reduce<{ id: Id<"pollSlots">; yes: number } | null>((best, s) => {
        const yes = countsFor(s._id).yes;
        return !best || yes > best.yes ? { id: s._id, yes } : best;
      }, null);

  async function voteSlot(slotId: Id<"pollSlots">, value: Vote) {
    if (!currentUser) return;
    await castVote({ userId: currentUser._id, pollId, slotId, value });
  }
  async function votePlace(placeOptionId: Id<"pollPlaceOptions">, value: Vote) {
    if (!currentUser) return;
    await castVote({ userId: currentUser._id, pollId, placeOptionId, value });
  }

  async function doConvert() {
    if (!currentUser || !leader) return;
    try {
      const eventId = await convert({
        userId: currentUser._id,
        pollId,
        winningSlotId: leader.id,
      });
      push.push({ title: "Plan's set! You've got a meetup.", joy: true });
      router.replace({ pathname: "/event/[id]", params: { id: eventId } });
    } catch (e) {
      Alert.alert("Couldn't convert", String((e as Error).message));
    }
  }

  return (
    <Screen
      title={poll.title}
      subtitle={converted ? "Converted to a meetup" : "Tap your pick for each option"}
    >
      {isPlace
        ? placeOptions.map((p) => (
            <VoteRow
              key={p._id}
              title={p.name}
              subtitle={`★ ${p.rating ?? "—"} · ${p.address}`}
              counts={countsFor(p._id)}
              mine={myVotes[p._id]}
              disabled={converted}
              onVote={(v) => votePlace(p._id, v)}
            />
          ))
        : slots.map((slot) => (
            <VoteRow
              key={slot._id}
              title={formatDate(slot.startsAt)}
              subtitle={formatRange(slot.startsAt, slot.endsAt)}
              counts={countsFor(slot._id)}
              mine={myVotes[slot._id]}
              highlight={leader?.id === slot._id && leader.yes > 0}
              disabled={converted}
              onVote={(v) => voteSlot(slot._id, v)}
            />
          ))}

      {isOrganizer && !converted && !isPlace && (
        <View className="mt-3">
          <PrimaryButton
            label="Convert winning slot → meetup"
            onPress={doConvert}
            disabled={!leader || leader.yes === 0}
          />
          <Text type="body-xs" color="muted" align="center" className="mt-2">
            Picks the slot with the most “yes”. Voters auto-RSVP.
          </Text>
        </View>
      )}

      {isPlace && !converted && (
        <Text type="body-xs" color="muted" align="center" className="mt-2">
          Place polls settle the venue. Pair with a Time Poll to lock the date.
        </Text>
      )}

      {converted && poll.eventId && (
        <View className="mt-3">
          <PrimaryButton
            label="Open the meetup"
            onPress={() =>
              router.replace({
                pathname: "/event/[id]",
                params: { id: poll.eventId as string },
              })
            }
          />
        </View>
      )}
    </Screen>
  );
}
