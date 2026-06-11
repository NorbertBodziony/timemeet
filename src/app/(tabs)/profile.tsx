import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import Constants from "expo-constants";
import { ListGroup, Separator, Text } from "heroui-native";
import { Icon } from "../../components/Icon";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { UserAvatar } from "../../components/UserAvatar";
import { useAuth } from "../../providers/MockAuthProvider";
import type { IconName } from "../../lib/icons";
import { useT } from "../../providers/LanguageProvider";

const ROWS: { key: string; icon: IconName; href: string }[] = [
  { key: "settings.profile", icon: "person-outline", href: "/settings/profile" },
  { key: "settings.friends", icon: "people-outline", href: "/friends" },
  { key: "settings.crews", icon: "people-circle-outline", href: "/crews" },
  { key: "settings.language", icon: "globe-outline", href: "/settings/language" },
  { key: "settings.notifications", icon: "notifications-outline", href: "/settings/notifications" },
  { key: "settings.refer", icon: "gift-outline", href: "/settings/referrals" },
  { key: "settings.privacy", icon: "lock-closed-outline", href: "/settings/privacy" },
  { key: "settings.help", icon: "help-circle-outline", href: "/settings/help" },
  { key: "settings.legal", icon: "document-text-outline", href: "/settings/legal" },
];

export default function SettingsHome() {
  const router = useRouter();
  const { t } = useT();
  const { currentUser, users, switchUser } = useAuth();

  return (
    <Screen title={t("settings.title")} bottomInset={49}>
      {/* Identity header */}
      <View className="flex-row items-center gap-3 mb-6">
        <UserAvatar name={currentUser?.displayName} photoUrl={currentUser?.photoUrl} size="lg" />
        <View className="flex-1">
          <Text type="h3" weight="bold">
            {currentUser?.displayName ?? "—"}
          </Text>
          <Text type="body-xs" color="muted">
            {currentUser?.referralCode ?? ""}
          </Text>
        </View>
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
                <ListGroup.ItemTitle>{t(r.key)}</ListGroup.ItemTitle>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </View>
        ))}
      </ListGroup>

      {/* Dev-only: switch the mock user to exercise other flows. */}
      {users.length > 1 && (
        <View>
          <SectionHeader>{t("settings.switchUser")}</SectionHeader>
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
                  <UserAvatar name={u.displayName} photoUrl={u.photoUrl} size="md" />
                  <Text type="body-xs" color={on ? "default" : "muted"}>
                    {u.displayName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <Text type="body-xs" color="muted" align="center" className="mt-8">
        MeetTime v{Constants.expoConfig?.version ?? "1.0.0"}
      </Text>
    </Screen>
  );
}
