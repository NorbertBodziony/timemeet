import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Share, View } from "react-native";
import * as Linking from "expo-linking";
import { useMutation, useQuery } from "convex/react";
import { Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SecondaryButton } from "../../components/SecondaryButton";
import { StatusPills, type PillOption } from "../../components/StatusPills";
import { SurfaceCard } from "../../components/SurfaceCard";
import { Icon } from "../../components/Icon";
import { formatDate, formatRange } from "../../lib/datetime";
import { attempt, errorMessage } from "../../lib/attempt";
import { tap } from "../../lib/haptics";
import { useAuth } from "../../providers/MockAuthProvider";
import { useCelebrate } from "../../providers/CelebrationProvider";

type Vote = "yes" | "maybe" | "no";
// Same status-pill control as RSVP, so voting reads identically across the app.
const VOTE_OPTIONS: PillOption[] = [
  { value: "yes", label: "Yes", color: "success", icon: "checkmark-circle" },
  { value: "maybe", label: "Maybe", color: "warning", icon: "help-circle" },
  { value: "no", label: "No", color: "default", icon: "close-circle" },
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
    <SurfaceCard className="mb-3 gap-3 py-3.5">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2 flex-row items-center gap-1.5">
          {highlight && <Icon name="trophy" size={14} tint="accent" />}
          <View className="flex-1">
            <Text weight="bold">{title}</Text>
            <Text type="body-xs" color="muted">
              {subtitle}
            </Text>
          </View>
        </View>
        <Text type="body-xs" weight="semibold" color="muted">
          {counts.yes} yes{counts.maybe ? ` · ${counts.maybe} maybe` : ""}
        </Text>
      </View>
      {!disabled && (
        <StatusPills
          options={VOTE_OPTIONS}
          value={mine ?? null}
          onChange={(v) => onVote(v as Vote)}
          columns={3}
        />
      )}
    </SurfaceCard>
  );
}

export default function PollDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pollId = id as Id<"polls">;
  const { currentUser } = useAuth();
  const { celebrate } = useCelebrate();

  const data = useQuery(
    api.polls.get,
    currentUser ? { pollId, userId: currentUser._id } : { pollId }
  );
  const agg = useQuery(api.polls.aggregate, { pollId });
  const castVote = useMutation(api.polls.vote);
  const convert = useMutation(api.polls.convertToEvent);

  if (data === undefined) return <Screen title="Loading…" dismiss="back">{null}</Screen>;
  if (data === null)
    return <Screen title="Poll not found" dismiss="back">{null}</Screen>;

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

  // Leading venue for a place poll — its winner seeds a new meetup's location.
  const placeLeader = isPlace
    ? placeOptions.reduce<{ name: string; address: string; yes: number } | null>(
        (best, p) => {
          const yes = countsFor(p._id).yes;
          return !best || yes > best.yes
            ? { name: p.name, address: p.address, yes }
            : best;
        },
        null
      )
    : null;

  async function voteSlot(slotId: Id<"pollSlots">, value: Vote) {
    if (!currentUser) return;
    tap();
    await attempt(() => castVote({ userId: currentUser._id, pollId, slotId, value }));
  }
  async function votePlace(placeOptionId: Id<"pollPlaceOptions">, value: Vote) {
    if (!currentUser) return;
    tap();
    await attempt(() => castVote({ userId: currentUser._id, pollId, placeOptionId, value }));
  }

  async function sharePoll() {
    const token = poll.shareToken;
    if (!token) return;
    const url = Linking.createURL(`/p/${token}`);
    try {
      await Share.share({ message: `Vote on "${poll.title}" — no account needed\n${url}`, url });
    } catch {
      Alert.alert("Couldn't open share", url);
    }
  }

  async function doConvert() {
    if (!currentUser || !leader) return;
    try {
      const eventId = await convert({
        userId: currentUser._id,
        pollId,
        winningSlotId: leader.id,
      });
      celebrate("Plan's set! You've got a meetup.");
      router.replace({ pathname: "/event/[id]", params: { id: eventId } });
    } catch (e) {
      Alert.alert("Couldn't convert", errorMessage(e));
    }
  }

  return (
    <Screen
      title={poll.title}
      subtitle={converted ? "Converted to a meetup" : "Tap your pick for each option"}
      dismiss="back"
    >
      {!converted && !!poll.shareToken && (
        <View className="mb-4">
          <SecondaryButton icon="share-outline" label="Share to collect votes" onPress={sharePoll} />
        </View>
      )}
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

      {isPlace && !converted && isOrganizer && (
        <View className="mt-3">
          <PrimaryButton
            label="Use winning place → new meetup"
            onPress={() =>
              placeLeader &&
              router.push({
                pathname: "/event/new",
                params: { title: poll.title, address: placeLeader.address },
              })
            }
            disabled={!placeLeader || placeLeader.yes === 0}
          />
          <Text type="body-xs" color="muted" align="center" className="mt-2">
            Seeds a meetup at the top venue — you pick the time next.
          </Text>
        </View>
      )}
      {isPlace && !converted && !isOrganizer && (
        <Text type="body-xs" color="muted" align="center" className="mt-2">
          Place polls settle the venue. The organizer turns the winner into a meetup.
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
