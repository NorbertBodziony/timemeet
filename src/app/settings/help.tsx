import { Linking, View } from "react-native";
import { Text } from "heroui-native";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { SurfaceCard } from "../../components/SurfaceCard";
import { useT } from "../../providers/LanguageProvider";

const FAQ: { q: string; a: string }[] = [
  { q: "help.q1", a: "help.a1" },
  { q: "help.q2", a: "help.a2" },
  { q: "help.q3", a: "help.a3" },
  { q: "help.q4", a: "help.a4" },
];

export default function Help() {
  const { t } = useT();
  return (
    <Screen title={t("help.title")} subtitle={t("help.subtitle")} dismiss="back">
      <SectionHeader tight>{t("help.faq")}</SectionHeader>
      <View className="gap-2.5">
        {FAQ.map((f) => (
          <SurfaceCard key={f.q} className="gap-1.5 py-3.5">
            <Text weight="semibold">{t(f.q)}</Text>
            <Text type="body-sm" color="muted" className="leading-5">
              {t(f.a)}
            </Text>
          </SurfaceCard>
        ))}
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
