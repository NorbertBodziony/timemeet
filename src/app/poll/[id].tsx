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
import { SectionHeader } from "../../components/SectionHeader";
import { StatusPills, type PillOption } from "../../components/StatusPills";
import { SurfaceCard } from "../../components/SurfaceCard";
import { Icon } from "../../components/Icon";
import { formatDate, formatRange } from "../../lib/datetime";
import { attempt, errorMessage } from "../../lib/attempt";
import { tap, warn } from "../../lib/haptics";
import { RSVP_COLORS } from "../../lib/theme";
import { useAuth } from "../../providers/MockAuthProvider";
import { useCelebrate } from "../../providers/CelebrationProvider";
import { useT } from "../../providers/LanguageProvider";
import { t as tt } from "../../lib/i18n";

type Vote = "yes" | "maybe" | "no";
// Same status-pill control as RSVP, so voting reads identically across the app.
const voteOptions = (): PillOption[] => [
  { value: "yes", label: tt("poll.yes"), fill: RSVP_COLORS.going.fill, icon: "checkmark-circle" },
  { value: "maybe", label: tt("poll.maybe"), fill: RSVP_COLORS.maybe.fill, icon: "help-circle" },
  { value: "no", label: tt("poll.no"), fill: RSVP_COLORS.not_going.fill, icon: "close-circle" },
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
          {tt("poll.yesCount", { count: counts.yes })}{counts.maybe ? tt("poll.maybeCount", { count: counts.maybe }) : ""}
        </Text>
      </View>
      {!disabled && (
        <StatusPills
          options={voteOptions()}
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
  const { t } = useT();
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

  if (data === undefined) return <Screen title={t("common.loading")} dismiss="back">{null}</Screen>;
  if (data === null)
    return <Screen title={t("common.pollNotFound")} dismiss="back">{null}</Screen>;

  const { poll, slots, placeOptions, myVotes } = data;
  const isOrganizer = currentUser?._id === poll.creatorId;
  const converted = poll.status === "converted";
  const expired = poll.status === "active" && (poll.expiresAt ?? Infinity) < Date.now();
  const locked = converted || expired;
  const isPlace = poll.type === "place"; // place-only
  const hasSlots = poll.type !== "place";
  const hasPlaces = poll.type !== "time";
  const both = hasSlots && hasPlaces;
  const countsFor = (key: string) => agg?.[key] ?? { yes: 0, maybe: 0, no: 0 };

  const leader = !hasSlots
    ? null
    : slots.reduce<{ id: Id<"pollSlots">; yes: number } | null>((best, s) => {
        const yes = countsFor(s._id).yes;
        return !best || yes > best.yes ? { id: s._id, yes } : best;
      }, null);

  // Leading venue — fills the converted meetup's location (time_place), or
  // seeds a new meetup for a place-only poll.
  const placeLeader = !hasPlaces
    ? null
    : placeOptions.reduce<{ name: string; address: string; yes: number } | null>(
        (best, p) => {
          const yes = countsFor(p._id).yes;
          return !best || yes > best.yes
            ? { name: p.name, address: p.address, yes }
            : best;
        },
        null
      );

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
      await Share.share({ message: t("poll.shareMessage", { title: poll.title, url }), url });
    } catch {
      Alert.alert(t("errors.shareTitle"), url);
    }
  }

  async function doConvert() {
    if (!currentUser || !leader) return;
    try {
      const eventId = await convert({
        userId: currentUser._id,
        pollId,
        winningSlotId: leader.id,
        // time_place: the winning venue becomes the meetup's address.
        customAddress: both ? placeLeader?.address : undefined,
      });
      celebrate(t("poll.planSetCelebrate"));
      router.replace({ pathname: "/event/[id]", params: { id: eventId } });
    } catch (e) {
      warn();
      Alert.alert(t("errors.convertTitle"), errorMessage(e));
    }
  }

  return (
    <Screen
      title={poll.title}
      subtitle={converted ? t("poll.converted") : expired ? t("poll.expired") : t("poll.tapYourPick")}
      dismiss="back"
    >
      {!locked && !!poll.shareToken && (
        <View className="mb-4">
          <SecondaryButton icon="share-outline" label={t("poll.share")} onPress={sharePoll} />
        </View>
      )}
      {hasSlots && (
        <>
          {both && <SectionHeader tight>{t("poll.when")}</SectionHeader>}
          {slots.map((slot) => (
            <VoteRow
              key={slot._id}
              title={formatDate(slot.startsAt)}
              subtitle={formatRange(slot.startsAt, slot.endsAt)}
              counts={countsFor(slot._id)}
              mine={myVotes[slot._id]}
              highlight={leader?.id === slot._id && leader.yes > 0}
              disabled={locked}
              onVote={(v) => voteSlot(slot._id, v)}
            />
          ))}
        </>
      )}

      {hasPlaces && (
        <>
          {both && <SectionHeader>{t("poll.where")}</SectionHeader>}
          {placeOptions.map((p) => (
            <VoteRow
              key={p._id}
              title={p.name}
              subtitle={`★ ${p.rating ?? "—"} · ${p.address}`}
              counts={countsFor(p._id)}
              mine={myVotes[p._id]}
              disabled={locked}
              onVote={(v) => votePlace(p._id, v)}
            />
          ))}
        </>
      )}

      {isOrganizer && !converted && hasSlots && (
        <View className="mt-3">
          <PrimaryButton
            label={t(both ? "poll.convertBoth" : "poll.convertSlot")}
            onPress={doConvert}
            disabled={!leader || leader.yes === 0}
          />
          <Text type="body-xs" color="muted" align="center" className="mt-2">
            {t(both ? "poll.convertHintBoth" : "poll.convertHint")}
          </Text>
        </View>
      )}

      {isPlace && !converted && isOrganizer && (
        <View className="mt-3">
          <PrimaryButton
            label={t("poll.usePlace")}
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
            {t("poll.usePlaceHint")}
          </Text>
        </View>
      )}
      {isPlace && !converted && !isOrganizer && (
        <Text type="body-xs" color="muted" align="center" className="mt-2">
          {t("poll.placeOrganizerHint")}
        </Text>
      )}

      {converted && poll.eventId && (
        <View className="mt-3">
          <PrimaryButton
            label={t("poll.openMeetup")}
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
