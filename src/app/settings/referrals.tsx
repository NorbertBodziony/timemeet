import { useState } from "react";
import { Alert, Share, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Card, Input, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { FormLabel } from "../../components/FormLabel";
import { Icon } from "../../components/Icon";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../providers/MockAuthProvider";
import { useT } from "../../providers/LanguageProvider";
import { warn } from "../../lib/haptics";
import { errorMessage } from "../../lib/attempt";

const STEPS: { icon: "share-outline" | "person-add-outline" | "gift-outline"; key: string }[] = [
  { icon: "share-outline", key: "ref.step1" },
  { icon: "person-add-outline", key: "ref.step2" },
  { icon: "gift-outline", key: "ref.step3" },
];

export default function Referrals() {
  const { t } = useT();
  const { currentUser } = useAuth();
  const stats = useQuery(
    api.referrals.myStats,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const setReferredBy = useMutation(api.referrals.setReferredBy);
  const [code, setCode] = useState("");

  function share() {
    Share.share({
      message: t("ref.shareMessage", { code: stats?.code ?? "" }),
    }).catch(() => {});
  }

  async function submitReferredBy() {
    if (!currentUser || !code.trim()) return;
    try {
      await setReferredBy({ userId: currentUser._id, code: code.trim() });
      setCode("");
      Alert.alert(t("ref.thanks"), t("ref.noted"));
    } catch (e) {
      warn();
      Alert.alert(t("errors.hmm"), errorMessage(e));
    }
  }

  return (
    <Screen title={t("ref.title")} subtitle={t("ref.subtitle")} dismiss="back">
      <Card className="mb-5">
        <Card.Body className="items-center py-5">
          <Icon name="gift" size={28} tint="accent" />
          <Text type="body-xs" weight="semibold" color="muted" className="mt-2">
            {t("ref.yourCode")}
          </Text>
          <Text type="h2" weight="bold" className="mt-1">
            {stats?.code ?? "—"}
          </Text>
          {!!stats && (
            <Text type="body-xs" color="muted" className="mt-1">
              {t("ref.stats", { activated: stats.activated, total: stats.total })}
            </Text>
          )}
        </Card.Body>
      </Card>

      {STEPS.map((s, i) => (
        <View key={i} className="flex-row items-center gap-3 mb-3">
          <View className="h-8 w-8 rounded-full bg-accent-soft items-center justify-center">
            <Icon name={s.icon} size={16} tint="accent" />
          </View>
          <Text type="body-sm" className="flex-1">
            {t(s.key)}
          </Text>
        </View>
      ))}

      <View className="mt-3">
        <PrimaryButton label={t("ref.share")} onPress={share} />
      </View>

      <FormLabel className="mt-7">{t("ref.referredQ")}</FormLabel>
      <Input value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="MEETTIME-NAME-XXX" />
      <View className="mt-2">
        <PrimaryButton label={t("ref.addCode")} onPress={submitReferredBy} disabled={!code.trim()} />
      </View>
    </Screen>
  );
}
