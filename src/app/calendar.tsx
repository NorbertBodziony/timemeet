import { useRouter } from "expo-router";
import { useMemo } from "react";
import { View } from "react-native";
import { useQuery } from "convex/react";
import { Text } from "heroui-native";
import { api } from "../../convex/_generated/api";
import { EmptyState } from "../components/EmptyState";
import { EventCard } from "../components/EventCard";
import { Screen } from "../components/Screen";
import { SkeletonList } from "../components/Skeleton";
import { useAuth } from "../providers/MockAuthProvider";

function startOfDay(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function dayLabel(ms: number, now: number): string {
  const diff = Math.round((startOfDay(ms) - startOfDay(now)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return new Date(ms).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function Calendar() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const now = useMemo(() => Date.now(), []);
  const rows = useQuery(
    api.events.upcoming,
    currentUser ? { userId: currentUser._id, now } : "skip"
  );

  // Group the (already soonest-first) rows by day.
  const groups = useMemo(() => {
    const out: { label: string; rows: NonNullable<typeof rows> }[] = [];
    let key = "";
    for (const r of rows ?? []) {
      const k = String(startOfDay(r.event.startsAt));
      if (k !== key) {
        key = k;
        out.push({ label: dayLabel(r.event.startsAt, now), rows: [] });
      }
      out[out.length - 1].rows.push(r);
    }
    return out;
  }, [rows, now]);

  return (
    <Screen title="Calendar" subtitle="Everything you're in on, soonest first." dismiss="back">
      {rows === undefined ? (
        <SkeletonList />
      ) : rows.length === 0 ? (
        <EmptyState icon="calendar-outline" text="Nothing on the horizon yet — plan something." />
      ) : (
        groups.map((g) => (
          <View key={g.label} className="mb-2">
            <Text type="body-xs" weight="semibold" color="muted" className="ml-1 mb-2 tracking-wider">
              {g.label.toUpperCase()}
            </Text>
            {g.rows.map((r) => (
              <EventCard
                key={r.event._id}
                event={r.event}
                counts={r.counts}
                viewerStatus={r.viewerStatus}
                onPress={() =>
                  router.push({ pathname: "/event/[id]", params: { id: r.event._id } })
                }
              />
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}
