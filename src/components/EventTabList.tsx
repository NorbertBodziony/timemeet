import { useRouter } from "expo-router";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { View } from "react-native";
import { Spinner } from "heroui-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../providers/MockAuthProvider";
import { EmptyState } from "./EmptyState";
import { EventCard } from "./EventCard";
import { Screen } from "./Screen";
import type { IconName } from "../lib/icons";

type Tab = "to_confirm" | "going" | "history" | "mine";

export function EventTabList({
  tab,
  title,
  subtitle,
  empty,
  emptyIcon,
  action,
  right,
}: {
  tab: Tab;
  title: string;
  subtitle?: string;
  empty: string;
  emptyIcon?: IconName;
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
    <Screen title={title} subtitle={subtitle} right={right}>
      {action ? <View className="mb-4">{action}</View> : null}
      {rows === undefined ? (
        <View className="py-16 items-center">
          <Spinner />
        </View>
      ) : rows.length === 0 ? (
        <EmptyState text={empty} icon={emptyIcon} />
      ) : (
        rows.map((row) => (
          <EventCard
            key={row.event._id}
            event={row.event}
            counts={row.counts}
            past={tab === "history"}
            rating={row.rating}
            onPress={() =>
              router.push({ pathname: "/event/[id]", params: { id: row.event._id } })
            }
          />
        ))
      )}
    </Screen>
  );
}
