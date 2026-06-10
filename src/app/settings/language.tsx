import { View } from "react-native";
import { Text } from "heroui-native";
import { Icon } from "../../components/Icon";
import { Screen } from "../../components/Screen";
import { SurfaceCard } from "../../components/SurfaceCard";
import { tap } from "../../lib/haptics";
import type { Lang } from "../../lib/i18n";
import { useT } from "../../providers/LanguageProvider";

const OPTIONS: { lang: Lang; labelKey: string; flag: string }[] = [
  { lang: "pl", labelKey: "language.pl", flag: "🇵🇱" },
  { lang: "en", labelKey: "language.en", flag: "🇬🇧" },
];

export default function Language() {
  const { t, lang, setLang } = useT();
  return (
    <Screen title={t("language.title")} subtitle={t("language.subtitle")} dismiss="back">
      <View className="gap-2.5">
        {OPTIONS.map((o) => {
          const on = lang === o.lang;
          return (
            <SurfaceCard
              key={o.lang}
              className="flex-row items-center gap-3"
              onPress={() => {
                tap();
                setLang(o.lang);
              }}
            >
              <Text style={{ fontSize: 22 }}>{o.flag}</Text>
              <Text weight="semibold" className="flex-1">
                {t(o.labelKey)}
              </Text>
              {on && <Icon name="checkmark-circle" size={22} tint="accent" />}
            </SurfaceCard>
          );
        })}
      </View>
    </Screen>
  );
}
