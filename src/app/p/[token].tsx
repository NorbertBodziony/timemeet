import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { useMutation, useQuery } from "convex/react";
import { Input, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { EmptyState } from "../../components/EmptyState";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { StatusPills, type PillOption } from "../../components/StatusPills";
import { SurfaceCard } from "../../components/SurfaceCard";
import { formatDate, formatRange } from "../../lib/datetime";
import { RSVP_COLORS } from "../../lib/theme";
import { attempt } from "../../lib/attempt";
import { useT } from "../../providers/LanguageProvider";
import { t as tt } from "../../lib/i18n";

type Vote = "yes" | "maybe" | "no";
const voteOptions = (): PillOption[] => [
  { value: "yes", label: tt("poll.yes"), fill: RSVP_COLORS.going.fill, icon: "checkmark-circle" },
  { value: "maybe", label: tt("poll.maybe"), fill: RSVP_COLORS.maybe.fill, icon: "help-circle" },
  { value: "no", label: tt("poll.no"), fill: RSVP_COLORS.not_going.fill, icon: "close-circle" },
];

const KEY_STORE = "mt_guest_key";
const NAME_STORE = "mt_guest_name";

// Public, no-account poll voting (magic link). A device-local guestKey lets the
// same person update their votes; a name is optional.
export default function GuestPoll() {
  const { t } = useT();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [guestKey, setGuestKey] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    (async () => {
      let k = await AsyncStorage.getItem(KEY_STORE);
      if (!k) {
        // CSPRNG device key (unguessable) so only this device can change its votes.
        k = `g_${Crypto.randomUUID()}`;
        await AsyncStorage.setItem(KEY_STORE, k);
      }
      setGuestKey(k);
      const n = await AsyncStorage.getItem(NAME_STORE);
      if (n) setName(n);
    })();
  }, []);

  const data = useQuery(
    api.polls.resolveByToken,
    token && guestKey ? { token, guestKey } : "skip"
  );
  const agg = useQuery(
    api.polls.aggregate,
    data ? { pollId: data.poll._id } : "skip"
  );
  const voteGuest = useMutation(api.polls.voteAsGuest);

  async function onName(v: string) {
    setName(v);
    await AsyncStorage.setItem(NAME_STORE, v);
  }

  async function vote(target: { slotId?: Id<"pollSlots">; placeOptionId?: Id<"pollPlaceOptions"> }, value: Vote) {
    if (!token || !guestKey) return;
    await attempt(() => voteGuest({ token, guestKey, guestName: name.trim() || undefined, value, ...target }));
  }

  if (data === undefined) return <Screen title={t("common.loading")} dismiss="close">{null}</Screen>;
  if (data === null)
    return (
      <Screen title={t("guest.title")} dismiss="close">
        <EmptyState icon="link-outline" text={t("guest.linkInvalid")} />
      </Screen>
    );

  const { poll, slots, placeOptions, creator, myVotes } = data;
  const hasSlots = poll.type !== "place";
  const hasPlaces = poll.type !== "time";
  const both = hasSlots && hasPlaces;
  const countsFor = (key: string) => agg?.[key] ?? { yes: 0, maybe: 0, no: 0 };
  const closed = poll.status !== "active";

  // One voteable option card — shared by the time and place sections.
  function OptionCard({
    id,
    title,
    subtitle,
    target,
  }: {
    id: string;
    title: string;
    subtitle: string;
    target: { slotId?: Id<"pollSlots">; placeOptionId?: Id<"pollPlaceOptions"> };
  }) {
    const c = countsFor(id);
    return (
      <SurfaceCard className="mb-3 gap-3 py-3.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-2">
            <Text weight="bold">{title}</Text>
            <Text type="body-xs" color="muted">{subtitle}</Text>
          </View>
          <Text type="body-xs" weight="semibold" color="muted">
            {tt("poll.yesCount", { count: c.yes })}{c.maybe ? tt("poll.maybeCount", { count: c.maybe }) : ""}
          </Text>
        </View>
        {!closed && (
          <StatusPills
            options={voteOptions()}
            value={myVotes[id] ?? null}
            onChange={(v) => vote(target, v as Vote)}
            columns={3}
          />
        )}
      </SurfaceCard>
    );
  }

  return (
    <Screen
      title={poll.title}
      subtitle={closed ? t("guest.closed") : t("guest.wantsYourPick", { name: creator?.displayName ?? t("guest.friend") })}
      dismiss="close"
    >
      {!closed && (
        <View className="mb-5">
          <Input value={name} onChangeText={onName} placeholder={t("guest.namePlaceholder")} />
        </View>
      )}

      {hasSlots && (
        <>
          {both && <SectionHeader tight>{t("poll.when")}</SectionHeader>}
          {slots.map((s) => (
            <OptionCard
              key={s._id}
              id={s._id}
              title={formatDate(s.startsAt)}
              subtitle={formatRange(s.startsAt, s.endsAt)}
              target={{ slotId: s._id }}
            />
          ))}
        </>
      )}

      {hasPlaces && (
        <>
          {both && <SectionHeader>{t("poll.where")}</SectionHeader>}
          {placeOptions.map((p) => (
            <OptionCard
              key={p._id}
              id={p._id}
              title={p.name}
              subtitle={p.address}
              target={{ placeOptionId: p._id }}
            />
          ))}
        </>
      )}

      <Text type="body-xs" color="muted" align="center" className="mt-2">
        {t("guest.savedNote")}
      </Text>
    </Screen>
  );
}
