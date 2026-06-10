import { useRouter } from "expo-router";
import { View } from "react-native";
import { Text } from "heroui-native";
import { Icon } from "../components/Icon";
import { IconTile } from "../components/IconTile";
import { Screen } from "../components/Screen";
import { SurfaceCard } from "../components/SurfaceCard";
import type { IconName } from "../lib/icons";
import { useT } from "../providers/LanguageProvider";

type Option = {
  icon: IconName;
  titleKey: string;
  bodyKey: string;
  href: string;
};

// The four ways to start a plan (docs §8). Event first — when you already know
// when & where, skip the voting entirely (the Luma case).
const OPTIONS: Option[] = [
  { icon: "calendar", titleKey: "create.event", bodyKey: "create.eventBody", href: "/event/new" },
  { icon: "time-outline", titleKey: "create.timePoll", bodyKey: "create.timePollBody", href: "/poll/new?type=time" },
  { icon: "location-outline", titleKey: "create.placePoll", bodyKey: "create.placePollBody", href: "/poll/new?type=place" },
  { icon: "options-outline", titleKey: "create.bothPoll", bodyKey: "create.bothPollBody", href: "/poll/new?type=time_place" },
];

export default function Create() {
  const router = useRouter();
  const { t } = useT();
  return (
    <Screen title={t("create.title")} subtitle={t("create.subtitle")} dismiss="close">
      <View className="gap-2.5">
        {OPTIONS.map((o) => (
          <SurfaceCard
            key={o.href}
            className="flex-row items-center gap-3 py-3.5"
            onPress={() => {
              router.dismiss();
              router.push(o.href as never);
            }}
          >
            <IconTile name={o.icon} size="md" />
            <View className="flex-1">
              <Text weight="semibold">{t(o.titleKey)}</Text>
              <Text type="body-xs" color="muted">
                {t(o.bodyKey)}
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} tint="muted" />
          </SurfaceCard>
        ))}
      </View>
    </Screen>
  );
}
