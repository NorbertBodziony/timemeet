import { useRouter } from "expo-router";
import { View } from "react-native";
import { Text } from "heroui-native";
import { Icon } from "../components/Icon";
import { IconTile } from "../components/IconTile";
import { Screen } from "../components/Screen";
import { SurfaceCard } from "../components/SurfaceCard";
import type { IconName } from "../lib/icons";

type Option = {
  icon: IconName;
  title: string;
  body: string;
  href: string;
};

// The four ways to start a plan (docs §8). Event first — when you already know
// when & where, skip the voting entirely (the Luma case).
const OPTIONS: Option[] = [
  {
    icon: "calendar",
    title: "New event",
    body: "You know when & where — skip the voting.",
    href: "/event/new",
  },
  {
    icon: "time-outline",
    title: "Time poll",
    body: "Crew picks the time.",
    href: "/poll/new?type=time",
  },
  {
    icon: "location-outline",
    title: "Place poll",
    body: "Crew picks the spot.",
    href: "/poll/new?type=place",
  },
  {
    icon: "options-outline",
    title: "Time & place poll",
    body: "Vote on both at once.",
    href: "/poll/new?type=time_place",
  },
];

export default function Create() {
  const router = useRouter();
  return (
    <Screen title="New plan" subtitle="How do you want to start?" dismiss="close">
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
              <Text weight="semibold">{o.title}</Text>
              <Text type="body-xs" color="muted">
                {o.body}
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} tint="muted" />
          </SurfaceCard>
        ))}
      </View>
    </Screen>
  );
}
