import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import { Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { Icon } from "../../components/Icon";
import { Lutek } from "../../components/Lutek";
import { PrimaryButton } from "../../components/PrimaryButton";
import { RsvpPicker } from "../../components/RsvpPicker";
import { Screen } from "../../components/Screen";
import { SecondaryButton } from "../../components/SecondaryButton";
import { SurfaceCard } from "../../components/SurfaceCard";
import { UserAvatar } from "../../components/UserAvatar";
import { formatDateTime } from "../../lib/datetime";
import { attempt } from "../../lib/attempt";
import { success } from "../../lib/haptics";
import { type RsvpStatus } from "../../lib/theme";
import { useAuth } from "../../providers/MockAuthProvider";
import { useCelebrate } from "../../providers/CelebrationProvider";

// RSVP-first, auth-second: a signed-out tap is stashed here, auth runs, and we
// finish the RSVP the moment they're back (F188).
const PENDING_KEY = "mt_pending_rsvp";

const DONE_HEADER: Record<RsvpStatus, string> = {
  going: "You're in! 🎉",
  maybe: "Maybe — no stress",
  waitlist: "You're holding a spot",
  not_going: "Can't make it this time",
  no_response: "Got it",
};

// ⭐ Invited flow (docs §3.8, F187–F190). Target: RSVP in < 30s.
export default function InviteLanding() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { currentUser } = useAuth();
  const { celebrate } = useCelebrate();
  const now = useMemo(() => Date.now(), []);

  const data = useQuery(api.invites.resolve, { token: token ?? "", now });
  const setRsvp = useMutation(api.rsvps.set);
  const [done, setDone] = useState<RsvpStatus | null>(null);
  const applying = useRef(false);

  // Finish a stashed RSVP after the auth round-trip.
  useEffect(() => {
    (async () => {
      if (!currentUser || !token || applying.current) return;
      const raw = await AsyncStorage.getItem(PENDING_KEY);
      if (!raw) return;
      try {
        const pending = JSON.parse(raw) as { token: string; status: RsvpStatus };
        if (pending.token !== token) return;
        applying.current = true;
        await AsyncStorage.removeItem(PENDING_KEY);
        await rsvp(pending.status);
      } catch {
        await AsyncStorage.removeItem(PENDING_KEY);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, token, data?.status]);

  if (data === undefined) return <Screen title="Loading…" dismiss="back">{null}</Screen>;

  if (data.status === "expired") {
    return (
      <Screen title="This link has expired" dismiss="back">
        <Text color="muted">Ask the person who invited you for a fresh one.</Text>
        <View className="mt-5">
          <PrimaryButton label="See MeetTime" onPress={() => router.replace("/")} />
        </View>
      </Screen>
    );
  }
  if (data.status === "not_found") {
    return (
      <Screen title="Invite not found" dismiss="back">
        <Text color="muted">Double-check the link and try again.</Text>
        <View className="mt-5">
          <PrimaryButton label="Go to MeetTime" onPress={() => router.replace("/")} />
        </View>
      </Screen>
    );
  }

  const { event, creator, going, goingNames, isPast } = data;
  const inviter = creator?.displayName?.split(" ")[0] ?? "Someone";
  const namesLine =
    goingNames.length > 0
      ? `${goingNames.join(", ")}${going > goingNames.length ? ` +${going - goingNames.length}` : ""}`
      : null;

  async function rsvp(status: RsvpStatus) {
    if (!currentUser) {
      // RSVP-first: remember the choice, run quick auth, finish on return.
      await AsyncStorage.setItem(PENDING_KEY, JSON.stringify({ token, status }));
      router.push({
        pathname: "/login",
        params: { next: `/invite/${token}` },
      } as never);
      return;
    }
    const ok = await attempt(() => setRsvp({ userId: currentUser._id, eventId: event._id, status }));
    if (!ok) return;
    setDone(status);
    if (status === "going") {
      celebrate(`Nice, we'll let ${inviter} know!`); // celebrate() buzzes on its own
    } else {
      success();
    }
  }

  // F193 — the event already happened.
  if (isPast && !done) {
    return (
      <Screen title={event.title} dismiss="back">
        <View className="items-center py-10 gap-4">
          <Lutek mood="thinking" line="This one already happened — ask them what's next." size={52} />
          <PrimaryButton label="See MeetTime" onPress={() => router.replace("/")} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen dismiss="back">
      {/* F187 — the inviter IS the trust signal. */}
      <View className="items-center mb-6">
        <UserAvatar name={creator?.displayName} size="lg" />
        <Text weight="semibold" color="muted" className="mt-2">
          {inviter} invited you
        </Text>
        <Text
          type="h1"
          weight="bold"
          align="center"
          className="mt-1"
          style={{ letterSpacing: -0.4 }}
        >
          {event.title}
        </Text>
      </View>

      <SurfaceCard className="gap-2.5 py-4 mb-5">
        <View className="flex-row items-center gap-2">
          <Icon name="calendar-outline" size={16} tint="accent" />
          <Text weight="semibold">{formatDateTime(event.startsAt)}</Text>
        </View>
        {!!(event.customAddress ?? event.placeId) && (
          <View className="flex-row items-center gap-2">
            <Icon name="location-outline" size={16} tint="muted" />
            <Text type="body-sm" color="muted">
              {event.customAddress ?? event.placeId}
            </Text>
          </View>
        )}
        <View className="flex-row items-center gap-2">
          <Icon name="people-outline" size={16} tint="muted" />
          <Text type="body-sm" color="muted">
            {going} going{namesLine ? ` — ${namesLine}` : ""}
          </Text>
        </View>
      </SurfaceCard>

      {done ? (
        // F189 — confirmation, status-aware, with who else is in.
        <View className="items-center py-4 gap-3">
          <Lutek
            mood={done === "going" ? "celebrating" : "waving"}
            line={`Super — I'll let ${inviter} know.${namesLine ? ` Also in: ${namesLine}.` : ""}`}
            size={52}
          />
          <Text type="h2" weight="bold" className="mt-1">
            {DONE_HEADER[done]}
          </Text>
          <View className="w-full mt-2 gap-2.5">
            <PrimaryButton
              label="Open the meetup"
              onPress={() => router.replace({ pathname: "/event/[id]", params: { id: event._id } })}
            />
            <SecondaryButton
              label="See how MeetTime works"
              onPress={() => router.push("/welcome" as never)}
            />
          </View>
        </View>
      ) : (
        <>
          <View className="mb-4">
            <Lutek mood="waving" line={`Hey, I'm Lutek. Tell ${inviter} if you're in.`} size={40} />
          </View>
          <RsvpPicker value={null} onChange={rsvp} />
          {!currentUser && (
            <Text type="body-xs" color="muted" align="center" className="mt-3">
              Tap your answer first — quick sign-in comes after.
            </Text>
          )}
        </>
      )}
    </Screen>
  );
}
