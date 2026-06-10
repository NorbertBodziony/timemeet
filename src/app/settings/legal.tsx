import { View } from "react-native";
import { Text } from "heroui-native";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { useT } from "../../providers/LanguageProvider";

const SECTIONS: { title: string; body: string }[] = [
  { title: "legal.termsTitle", body: "legal.termsBody" },
  { title: "legal.privacyTitle", body: "legal.privacyBody" },
  { title: "legal.cookiesTitle", body: "legal.cookiesBody" },
  { title: "legal.licensesTitle", body: "legal.licensesBody" },
];

export default function Legal() {
  const { t } = useT();
  return (
    <Screen title={t("legal.title")} subtitle={t("legal.subtitle")} dismiss="back">
      <View className="gap-1">
        {SECTIONS.map((s, i) => (
          <View key={s.title}>
            <SectionHeader tight={i === 0}>{t(s.title)}</SectionHeader>
            <Text type="body-sm" color="muted" className="leading-5">
              {t(s.body)}
            </Text>
          </View>
        ))}
      </View>
      <Text type="body-xs" color="muted" align="center" className="mt-8">
        {t("legal.footer")}
      </Text>
    </Screen>
  );
}
