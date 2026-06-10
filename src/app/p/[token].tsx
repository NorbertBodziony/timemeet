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
import { attempt } from "../../lib/attempt";

type Vote = "yes" | "maybe" | "no";
const VOTE_OPTIONS: PillOption[] = [
  { value: "yes", label: "Yes", color: "success", icon: "checkmark-circle" },
  { value: "maybe", label: "Maybe", color: "warning", icon: "help-circle" },
  { value: "no", label: "No", color: "default", icon: "close-circle" },
];

const KEY_STORE = "mt_guest_key";
const NAME_STORE = "mt_guest_name";

// Public, no-account poll voting (magic link). A device-local guestKey lets the
// same person update their votes; a name is optional.
export default function GuestPoll() {
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

  if (data === undefined) return <Screen title="Loading…" dismiss="close">{null}</Screen>;
  if (data === null)
    return (
      <Screen title="Poll" dismiss="close">
        <EmptyState icon="link-outline" text="This poll link is no longer valid." />
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
            {c.yes} yes{c.maybe ? ` · ${c.maybe} maybe` : ""}
          </Text>
        </View>
        {!closed && (
          <StatusPills
            options={VOTE_OPTIONS}
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
      subtitle={closed ? "This poll is closed." : `${creator?.displayName ?? "A friend"} wants your pick — no account needed`}
      dismiss="close"
    >
      {!closed && (
        <View className="mb-5">
          <Input value={name} onChangeText={onName} placeholder="Your name (so they know it's you)" />
        </View>
      )}

      {hasSlots && (
        <>
          {both && <SectionHeader tight>When</SectionHeader>}
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
          {both && <SectionHeader>Where</SectionHeader>}
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
        Your votes are saved on this device — come back anytime to change them.
      </Text>
    </Screen>
  );
}
