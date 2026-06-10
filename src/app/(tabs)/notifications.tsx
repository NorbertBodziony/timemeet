import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { EmptyState } from "../../components/EmptyState";
import { Icon } from "../../components/Icon";
import { Screen } from "../../components/Screen";
import { SkeletonList } from "../../components/Skeleton";
import { SurfaceCard } from "../../components/SurfaceCard";
import { formatRelative } from "../../lib/datetime";
import type { IconName } from "../../lib/icons";
import { useAuth } from "../../providers/MockAuthProvider";
import { useT } from "../../providers/LanguageProvider";

type NType = Doc<"notifications">["type"];

const META: Record<NType, { icon: IconName; tint: string }> = {
  invite: { icon: "mail-outline", tint: "accent" },
  poll_resolved: { icon: "checkmark-done-outline", tint: "success" },
  event_cancelled: { icon: "close-circle-outline", tint: "danger" },
  rsvp: { icon: "person-outline", tint: "success" },
  post: { icon: "chatbubble-outline", tint: "accent" },
  reminder: { icon: "alarm-outline", tint: "warning" },
};

export default function Notifications() {
  const router = useRouter();
  const { t } = useT();
  const { currentUser } = useAuth();
  const rows = useQuery(
    api.notifications.listForUser,
    currentUser ? { userId: currentUser._id, limit: 40 } : "skip"
  );
  const markAllRead = useMutation(api.notifications.markAllRead);

  // Reading the inbox clears the unread badge.
  useEffect(() => {
    if (currentUser && rows && rows.some((n) => !n.read)) {
      markAllRead({ userId: currentUser._id });
    }
  }, [currentUser, rows, markAllRead]);

  return (
    <Screen title={t("notifScreen.title")} bottomInset={49}>
      {rows === undefined ? (
        <SkeletonList count={5} />
      ) : rows.length === 0 ? (
        <EmptyState text={t("notifScreen.empty")} icon="notifications-outline" />
      ) : (
        <View className="gap-2.5">
          {rows.map((n) => {
            const m = META[n.type];
            const eid = n.eventId;
            return (
              <SurfaceCard
                key={n._id}
                className="flex-row items-center gap-3"
                onPress={
                  eid
                    ? () => router.push({ pathname: "/event/[id]", params: { id: eid } })
                    : undefined
                }
              >
                <View className="h-9 w-9 rounded-full bg-default-soft items-center justify-center">
                  <Icon name={m.icon} size={18} tint={m.tint} />
                </View>
                <View className="flex-1">
                  <Text type="body-sm" weight={n.read ? "normal" : "semibold"}>
                    {n.title}
                  </Text>
                  <Text type="body-xs" color="muted">
                    {formatRelative(n._creationTime)}
                  </Text>
                </View>
                {!n.read && <View className="h-2.5 w-2.5 rounded-full bg-accent" />}
              </SurfaceCard>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
