import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useQuery } from "convex/react";
import { Text } from "heroui-native";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../providers/MockAuthProvider";
import { EmptyState } from "./EmptyState";
import { EventCard } from "./EventCard";
import { PressableScale } from "./PressableScale";
import { Screen } from "./Screen";
import { SkeletonList } from "./Skeleton";
import { CATEGORIES, type CategoryKey } from "../lib/categories";
import { impact } from "../lib/haptics";
import { useT } from "../providers/LanguageProvider";
import type { IconName } from "../lib/icons";
import type { LutekMood } from "./Lutek";

type Tab = "to_confirm" | "going" | "history" | "mine";

export function EventTabList({
  tab,
  title,
  subtitle,
  empty,
  emptyIcon,
  emptyLutek,
  topControl,
  action,
  right,
}: {
  tab: Tab;
  title: string;
  subtitle?: string;
  empty: string;
  emptyIcon?: IconName;
  emptyLutek?: LutekMood; // show Lutek (instead of an icon) on the empty state
  topControl?: ReactNode; // e.g. the Events segments
  action?: ReactNode;
  right?: ReactNode;
}) {
  const router = useRouter();
  const { t } = useT();
  const { currentUser } = useAuth();
  // Clear the translucent tab bar (~49pt above the safe area).
  const TAB_BAR = 49;
  // "now" is state so pull-to-refresh can re-stamp it (re-runs the time filter).
  const [now, setNow] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<CategoryKey | null>(null);

  const rows = useQuery(
    api.events.listByTab,
    currentUser ? { userId: currentUser._id, tab, now } : "skip"
  );

  const onRefresh = useCallback(() => {
    impact();
    setRefreshing(true);
    setNow(Date.now());
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  // Which categories actually appear in this tab — only offer a filter row when
  // there's a real choice to make.
  const present = new Set((rows ?? []).map((r) => r.event.category?.[0]).filter(Boolean));
  const chips = CATEGORIES.filter((c) => present.has(c.key));
  const showFilter = chips.length >= 2;

  const visible = (rows ?? []).filter(
    (r) => !filter || r.event.category?.includes(filter)
  );

  return (
    <Screen
      title={title}
      subtitle={subtitle}
      right={right}
      bottomInset={TAB_BAR}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {topControl ? <View className="mb-4">{topControl}</View> : null}
      {action ? <View className="mb-4">{action}</View> : null}

      {showFilter && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5 mb-4"
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {[null, ...chips.map((c) => c.key)].map((key) => {
            const on = filter === key;
            const cat = key && CATEGORIES.find((c) => c.key === key);
            return (
              <PressableScale key={key ?? "all"} onPress={() => setFilter(key)} style={{ borderRadius: 999 }}>
                <View
                  className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 border ${
                    on ? "bg-accent-soft border-accent-soft" : "bg-surface border-border"
                  }`}
                >
                  {cat && <Text type="body-sm">{cat.emoji}</Text>}
                  <Text
                    type="body-sm"
                    weight="semibold"
                    className={on ? "text-accent-soft-foreground" : "text-foreground"}
                  >
                    {cat ? t(cat.labelKey) : t("filter.all")}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>
      )}

      {rows === undefined ? (
        <SkeletonList />
      ) : visible.length === 0 ? (
        <EmptyState text={empty} icon={emptyIcon} lutek={emptyLutek} />
      ) : (
        visible.map((row) => (
          <EventCard
            key={row.event._id}
            event={row.event}
            counts={row.counts}
            past={tab === "history"}
            rating={row.rating}
            coverUrl={row.coverUrl}
            onPress={() =>
              router.push({ pathname: "/event/[id]", params: { id: row.event._id } })
            }
          />
        ))
      )}
    </Screen>
  );
}
