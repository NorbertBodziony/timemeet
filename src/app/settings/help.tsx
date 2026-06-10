import { useState } from "react";
import { Linking, View } from "react-native";
import { Text } from "heroui-native";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { SurfaceCard } from "../../components/SurfaceCard";
import { useT } from "../../providers/LanguageProvider";
import { Icon } from "../../components/Icon";
import { tap } from "../../lib/haptics";

const FAQ: { q: string; a: string }[] = [
  { q: "help.q1", a: "help.a1" },
  { q: "help.q2", a: "help.a2" },
  { q: "help.q3", a: "help.a3" },
  { q: "help.q4", a: "help.a4" },
];

export default function Help() {
  const { t } = useT();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Screen title={t("help.title")} subtitle={t("help.subtitle")} dismiss="back">
      <SectionHeader tight>{t("help.faq")}</SectionHeader>
      <View className="gap-2.5">
        {FAQ.map((f) => {
          const expanded = open === f.q;
          return (
            <SurfaceCard
              key={f.q}
              className="gap-1.5 py-3.5"
              onPress={() => {
                tap();
                setOpen(expanded ? null : f.q);
              }}
            >
              <View className="flex-row items-center justify-between gap-2">
                <Text weight="semibold" className="flex-1">
                  {t(f.q)}
                </Text>
                <Icon name={expanded ? "chevron-up" : "chevron-down"} size={16} tint="muted" />
              </View>
              {expanded && (
                <Text type="body-sm" color="muted" className="leading-5">
                  {t(f.a)}
                </Text>
              )}
            </SurfaceCard>
          );
        })}
      </View>

      <SectionHeader>{t("help.stuck")}</SectionHeader>
      <Text color="muted" className="mb-3 leading-5">
        {t("help.stuckBody")}
      </Text>
      <PrimaryButton
        label={t("help.contact")}
        onPress={() => Linking.openURL("mailto:hej@meettime.app?subject=MeetTime%20help")}
      />
    </Screen>
  );
}
