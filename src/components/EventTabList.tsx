import { useRouter } from "expo-router";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../providers/MockAuthProvider";
import { EmptyState } from "./EmptyState";
import { EventCard } from "./EventCard";
import { Screen } from "./Screen";

type Tab = "to_confirm" | "going" | "history" | "mine";

export function EventTabList({
  tab,
  title,
  empty,
  action,
  right,
}: {
  tab: Tab;
  title: string;
  empty: string;
  action?: ReactNode;
  right?: ReactNode;
}) {
  const router = useRouter();
  const { currentUser } = useAuth();
  // Capture "now" once per mount — queries can't read the clock (docs §11).
  const now = useMemo(() => Date.now(), []);

  const rows = useQuery(
    api.events.listByTab,
    currentUser ? { userId: currentUser._id, tab, now } : "skip"
  );

  return (
    <Screen title={title} right={right}>
      {action ? <View className="mb-4">{action}</View> : null}
      {rows === undefined ? (
        <View className="py-16 items-center">
          <ActivityIndicator color="#5DA802" />
        </View>
      ) : rows.length === 0 ? (
        <EmptyState text={empty} />
      ) : (
        rows.map(({ event, counts }) => (
          <EventCard
            key={event._id}
            event={event}
            counts={counts}
            onPress={() =>
              router.push({ pathname: "/event/[id]", params: { id: event._id } })
            }
          />
        ))
      )}
    </Screen>
  );
}
