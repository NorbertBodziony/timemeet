import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { EventTabList } from "../../components/EventTabList";
import { Icon } from "../../components/Icon";
import { MyPolls } from "../../components/MyPolls";
import { useT } from "../../providers/LanguageProvider";

export default function MineScreen() {
  const router = useRouter();
  const { t } = useT();
  return (
    <EventTabList
      tab="mine"
      title={t("mine.title")}
      empty={t("tabs.mine.empty")}
      emptyLutek="waving"
      action={<MyPolls />}
      right={
        // Nav-style actions — home keeps the single hero CTA, this tab gets a "+".
        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => router.push("/create" as never)} hitSlop={8}>
            <Icon name="add-circle-outline" size={24} tint="accent" />
          </Pressable>
          <Pressable onPress={() => router.push("/settings")} hitSlop={8}>
            <Icon name="settings-outline" size={22} tint="foreground" />
          </Pressable>
        </View>
      }
    />
  );
}
