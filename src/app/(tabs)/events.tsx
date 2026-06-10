import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable } from "react-native";
import { Tabs } from "heroui-native";
import { EventTabList } from "../../components/EventTabList";
import { Icon } from "../../components/Icon";
import type { LutekMood } from "../../components/Lutek";
import { tap } from "../../lib/haptics";
import { useAuth } from "../../providers/MockAuthProvider";
import { useT } from "../../providers/LanguageProvider";

type Seg = "to_confirm" | "going" | "history" | "mine";

// One Events screen — the four lists live behind a segmented control.
export default function EventsScreen() {
  const router = useRouter();
  const { t } = useT();
  const { currentUser } = useAuth();
  const [seg, setSeg] = useState<Seg>("going");
  const firstName = currentUser?.displayName?.split(" ")[0];

  const META: Record<Seg, { empty: string; lutek?: LutekMood }> = {
    going: { empty: t("tabs.going.empty"), lutek: "thinking" },
    to_confirm: { empty: t("tabs.toConfirm.empty") },
    history: { empty: t("tabs.history.empty") },
    mine: { empty: t("tabs.mine.empty"), lutek: "waving" },
  };

  return (
    <EventTabList
      key={seg}
      tab={seg}
      title={firstName ? t("tabs.going.titleNamed", { name: firstName }) : t("tabs.events")}
      empty={META[seg].empty}
      emptyLutek={META[seg].lutek}
      right={
        <Pressable onPress={() => router.push("/calendar" as never)} hitSlop={8}>
          <Icon name="calendar-outline" size={22} tint="foreground" />
        </Pressable>
      }
      topControl={
        <Tabs
          value={seg}
          onValueChange={(v) => {
            tap();
            setSeg(v as Seg);
          }}
        >
          <Tabs.List>
            <Tabs.Indicator />
            <Tabs.Trigger value="to_confirm">
              <Tabs.Label>{t("tabs.toConfirm")}</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="going">
              <Tabs.Label>{t("tabs.going")}</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="history">
              <Tabs.Label>{t("tabs.history")}</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="mine">
              <Tabs.Label>{t("tabs.mine")}</Tabs.Label>
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs>
      }
    />
  );
}
