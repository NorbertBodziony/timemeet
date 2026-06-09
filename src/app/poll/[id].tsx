import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { GradientButton } from "../../components/GradientButton";
import { Screen } from "../../components/Screen";
import { formatDate, formatRange } from "../../lib/datetime";
import { useAuth } from "../../providers/MockAuthProvider";
import { usePush } from "../../providers/MockPushProvider";

type Vote = "yes" | "maybe" | "no";
const VOTES: { value: Vote; label: string; color: string }[] = [
  { value: "yes", label: "Yes", color: "#5DA802" },
  { value: "maybe", label: "Maybe", color: "#F59E0B" },
  { value: "no", label: "No", color: "#9CA3AF" },
];

function VoteRow({
  optionId,
  title,
  subtitle,
  counts,
  mine,
  highlight,
  disabled,
  onVote,
}: {
  optionId: string;
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
      className="mb-3 rounded-2xl bg-surface border border-brand-evergreen/10 px-4 py-3"
      style={highlight ? { borderColor: "#5DA802" } : undefined}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-brand-evergreen text-[15px] font-bold">{title}</Text>
          <Text className="text-brand-evergreen/55 text-[12px]">{subtitle}</Text>
        </View>
        <Text className="text-rsvp-going text-[12px] font-semibold">
          {counts.yes} yes{counts.maybe ? ` · ${counts.maybe} maybe` : ""}
        </Text>
      </View>
      {!disabled && (
        <View className="flex-row gap-2 mt-3">
          {VOTES.map((v) => {
            const on = mine === v.value;
            return (
              <Pressable
                key={v.value}
                onPress={() => onVote(v.value)}
                className="flex-1 items-center rounded-xl border py-2"
                style={{
                  backgroundColor: on ? v.color : "#FFFFFF",
                  borderColor: on ? v.color : "rgba(15,26,0,0.12)",
                }}
              >
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: on ? "#FFFFFF" : "rgba(15,26,0,0.7)" }}
                >
                  {v.label}
                </Text>
              </Pressable>
            );
          })}
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

  // Leading time slot (most "yes") — the organizer's suggested winner.
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
              optionId={p._id}
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
              optionId={slot._id}
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
          <GradientButton
            label="Convert winning slot → meetup"
            onPress={doConvert}
            disabled={!leader || leader.yes === 0}
          />
          <Text className="text-brand-evergreen/45 text-[12px] text-center mt-2">
            Picks the slot with the most “yes”. Voters auto-RSVP.
          </Text>
        </View>
      )}

      {isPlace && !converted && (
        <Text className="text-brand-evergreen/45 text-[12px] text-center mt-2">
          Place polls settle the venue. Pair with a Time Poll to lock the date.
        </Text>
      )}

      {converted && poll.eventId && (
        <View className="mt-3">
          <GradientButton
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
