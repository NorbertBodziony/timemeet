import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { useQuery } from "convex/react";
import { Text } from "heroui-native";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Screen } from "../../../components/Screen";
import { SectionHeader } from "../../../components/SectionHeader";
import { SkeletonList } from "../../../components/Skeleton";
import { SurfaceCard } from "../../../components/SurfaceCard";
import { UserAvatar } from "../../../components/UserAvatar";
import { RSVP, RSVP_COLORS, type RsvpStatus } from "../../../lib/theme";
import { useT } from "../../../providers/LanguageProvider";

const ORDER: RsvpStatus[] = ["going", "maybe", "waitlist", "not_going", "no_response"];

// Full guest list, grouped by RSVP status (spec H) — visible to every invitee.
export default function Guests() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id as Id<"events">;

  const data = useQuery(api.events.get, { eventId });
  const rsvps = useQuery(api.rsvps.listForEvent, { eventId });

  const groups = ORDER.map((status) => ({
    status,
    rows: (rsvps ?? []).filter((r) => r.status === status),
  })).filter((g) => g.rows.length > 0);

  return (
    <Screen title={t("event.guestsTitle")} subtitle={data?.event.title} dismiss="back">
      {rsvps === undefined ? (
        <SkeletonList />
      ) : (
        groups.map((g, gi) => {
          const c = RSVP_COLORS[g.status];
          return (
            <View key={g.status}>
              <SectionHeader tight={gi === 0}>
                {`${t(RSVP[g.status].labelKey)} · ${g.rows.length}`}
              </SectionHeader>
              <View className="gap-2.5 mb-2">
                {g.rows.map((r) => (
                  <SurfaceCard key={r._id} className="flex-row items-center gap-3">
                    <UserAvatar
                      name={r.user?.displayName}
                      photoUrl={r.user?.photoUrl}
                      size="md"
                    />
                    <Text weight="semibold" className="flex-1">
                      {r.user?.displayName ?? "—"}
                    </Text>
                    <View
                      className="rounded-full px-2.5 py-1"
                      style={{ backgroundColor: c.soft }}
                    >
                      <Text type="body-xs" weight="semibold" style={{ color: c.softFg }}>
                        {t(RSVP[g.status].labelKey)}
                      </Text>
                    </View>
                  </SurfaceCard>
                ))}
              </View>
            </View>
          );
        })
      )}
    </Screen>
  );
}
