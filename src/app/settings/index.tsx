import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import Constants from "expo-constants";
import { useQuery } from "convex/react";
import { Chip, ListGroup, Separator, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { Icon } from "../../components/Icon";
import { Screen } from "../../components/Screen";
import { UserAvatar } from "../../components/UserAvatar";
import { useAuth } from "../../providers/MockAuthProvider";
import type { IconName } from "../../lib/icons";

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  meettime_plus: "MeetTime+",
  founder: "Founder",
};

const ROWS: { label: string; icon: IconName; href: string }[] = [
  { label: "Profile", icon: "person-outline", href: "/settings/profile" },
  { label: "Notifications", icon: "notifications-outline", href: "/settings/notifications" },
  { label: "MeetTime+", icon: "star-outline", href: "/settings/subscription" },
  { label: "Refer a friend", icon: "gift-outline", href: "/settings/referrals" },
  { label: "Privacy & data", icon: "lock-closed-outline", href: "/settings/privacy" },
];

export default function SettingsHome() {
  const router = useRouter();
  const { currentUser, users, switchUser, signOut } = useAuth();
  const sub = useQuery(
    api.subscriptions.get,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const plan = sub?.plan ?? "free";

  return (
    <Screen title="Settings" dismiss="back">
      {/* Identity header */}
      <View className="flex-row items-center gap-3 mb-6">
        <UserAvatar name={currentUser?.displayName} size="lg" />
        <View className="flex-1">
          <Text type="h3" weight="bold">
            {currentUser?.displayName ?? "—"}
          </Text>
          <Text type="body-xs" color="muted">
            {currentUser?.referralCode ?? ""}
          </Text>
        </View>
        <Chip color={plan === "free" ? "default" : "accent"} variant="soft" size="sm">
          <Chip.Label>{PLAN_LABEL[plan] ?? "Free"}</Chip.Label>
        </Chip>
      </View>

      <ListGroup>
        {ROWS.map((r, i) => (
          <View key={r.href}>
            {i > 0 && <Separator className="ml-14" />}
            <ListGroup.Item onPress={() => router.push(r.href as never)}>
              <ListGroup.ItemPrefix>
                <Icon name={r.icon} size={20} tint="accent" />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{r.label}</ListGroup.ItemTitle>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </View>
        ))}
      </ListGroup>

      {/* Dev-only: switch the mock user to exercise other flows. */}
      {users.length > 1 && (
        <View className="mt-7">
          <Text type="body-xs" weight="semibold" color="muted" className="mb-2">
            Switch user (dev)
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {users.map((u) => {
              const on = u._id === currentUser?._id;
              return (
                <Pressable
                  key={u._id}
                  onPress={() => switchUser(u._id)}
                  className="items-center gap-1"
                  style={{ opacity: on ? 1 : 0.5 }}
                >
                  <UserAvatar name={u.displayName} size="md" />
                  <Text type="body-xs" color={on ? "default" : "muted"}>
                    {u.displayName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <Pressable
        onPress={() => {
          signOut();
          router.replace("/welcome");
        }}
        className="mt-8 flex-row items-center justify-center gap-2 py-3"
      >
        <Icon name="log-out-outline" size={18} tint="danger" />
        <Text weight="semibold" className="text-danger">
          Sign out
        </Text>
      </Pressable>
      <Text type="body-xs" color="muted" align="center" className="mt-2">
        MeetTime v{Constants.expoConfig?.version ?? "1.0.0"}
      </Text>
    </Screen>
  );
}
