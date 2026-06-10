import { useRouter } from "expo-router";
import { View } from "react-native";
import { useQuery } from "convex/react";
import { Text } from "heroui-native";
import { api } from "../../convex/_generated/api";
import { Icon } from "./Icon";
import { SectionHeader } from "./SectionHeader";
import { SurfaceCard } from "./SurfaceCard";
import { useAuth } from "../providers/MockAuthProvider";
import { useT } from "../providers/LanguageProvider";

const DAY_MS = 24 * 60 * 60 * 1000;

// The user's open polls (time + place) — shown on My events so a poll is never
// a dead end after you leave it. Converted polls live on as events.
export function MyPolls() {
  const router = useRouter();
  const { t } = useT();
  const { currentUser } = useAuth();
  const polls = useQuery(
    api.polls.listMine,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const open = (polls ?? []).filter((p) => p.status === "active");
  if (open.length === 0) return null;

  return (
    <View className="mb-2">
      <SectionHeader tight>{t("myPolls.open")}</SectionHeader>
      <View className="gap-2.5 mb-2">
        {open.map((p) => {
          const daysLeft = Math.max(0, Math.ceil((p.expiresAt - Date.now()) / DAY_MS));
          const isPlace = p.type === "place";
          return (
            <SurfaceCard
              key={p._id}
              className="flex-row items-center gap-3"
              onPress={() =>
                router.push({ pathname: "/poll/[id]", params: { id: p._id } })
              }
            >
              <View className="w-10 h-10 rounded-xl bg-accent-soft items-center justify-center">
                <Icon name={isPlace ? "location-outline" : "time-outline"} size={19} tint="accent" />
              </View>
              <View className="flex-1">
                <Text weight="semibold" numberOfLines={1}>
                  {p.title}
                </Text>
                <Text type="body-xs" color="muted">
                  {t(isPlace ? "myPolls.placePoll" : "myPolls.timePoll")} ·{" "}
                  {daysLeft === 0 ? t("myPolls.closingToday") : t("myPolls.daysLeft", { count: daysLeft })}
                </Text>
              </View>
              <Icon name="chevron-forward" size={16} tint="muted" />
            </SurfaceCard>
          );
        })}
      </View>
    </View>
  );
}
