import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { EventTabList } from "../../components/EventTabList";
import { Icon } from "../../components/Icon";
import { NotificationBell } from "../../components/NotificationBell";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAuth } from "../../providers/MockAuthProvider";
import { useT } from "../../providers/LanguageProvider";

export default function GoingScreen() {
  const router = useRouter();
  const { t } = useT();
  const { currentUser } = useAuth();
  const firstName = currentUser?.displayName?.split(" ")[0];

  return (
    <EventTabList
      tab="going"
      title={firstName ? t("tabs.going.titleNamed", { name: firstName }) : t("tabs.going.title")}
      subtitle={t("tabs.going.subtitle")}
      empty={t("tabs.going.empty")}
      emptyLutek="thinking"
      right={
        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => router.push("/calendar" as never)} hitSlop={8}>
            <Icon name="calendar-outline" size={22} tint="foreground" />
          </Pressable>
          <NotificationBell />
        </View>
      }
      action={
        <PrimaryButton label={t("tabs.newPlan")} onPress={() => router.push("/create" as never)} />
      }
    />
  );
}
