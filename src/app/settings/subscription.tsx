import { Alert, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation, useQuery } from "convex/react";
import { Card, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { Icon } from "../../components/Icon";
import { IconTile } from "../../components/IconTile";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { GRADIENTS } from "../../lib/theme";
import { useAuth } from "../../providers/MockAuthProvider";
import { useT } from "../../providers/LanguageProvider";

const PLUS_BENEFITS = ["sub.b1", "sub.b2", "sub.b3", "sub.b4", "sub.b5"];

export default function Subscription() {
  const { t } = useT();
  const { currentUser } = useAuth();
  const sub = useQuery(
    api.subscriptions.get,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const setPlan = useMutation(api.subscriptions.setPlan);
  const plan = sub?.plan ?? "free";
  const isPlus = plan === "meettime_plus";

  async function choose(next: "free" | "meettime_plus") {
    if (!currentUser) return;
    await setPlan({ userId: currentUser._id, plan: next });
    if (next === "meettime_plus") {
      Alert.alert(t("sub.upgraded"), t("sub.mockNote"));
    }
  }

  return (
    <Screen title={t("sub.title")} subtitle={t("sub.subtitle")} dismiss="back">
      <Card className="mb-4">
        <Card.Body className="flex-row items-center gap-3">
          <IconTile name="star" size="md" />
          <View className="flex-1">
            <Text type="body-xs" weight="semibold" color="muted" className="tracking-wider">
              {t("sub.currentPlan")}
            </Text>
            <Text type="h3" weight="bold">
              {plan === "free" ? t("sub.free") : plan === "founder" ? t("sub.founder") : "MeetTime+"}
            </Text>
          </View>
        </Card.Body>
      </Card>

      {/* Premium tier — the DEEP brand gradient (§04). */}
      <LinearGradient
        colors={[...GRADIENTS.deep.colors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 16, padding: 18, marginBottom: 20 }}
      >
        <Text type="h3" weight="bold" className="mb-3" style={{ color: "#FFFFFF" }}>
          MeetTime+
        </Text>
        {PLUS_BENEFITS.map((b) => (
          <View key={b} className="flex-row items-center gap-2 mb-2">
            <Icon name="checkmark-circle" size={18} color="#A3FF12" />
            <Text type="body-sm" style={{ color: "#FFFFFF" }}>
              {t(b)}
            </Text>
          </View>
        ))}
      </LinearGradient>

      {isPlus ? (
        <PrimaryButton label={t("sub.switchFree")} variant="outline" onPress={() => choose("free")} />
      ) : (
        <PrimaryButton label={t("sub.upgrade")} onPress={() => choose("meettime_plus")} />
      )}
      <Text type="body-xs" color="muted" align="center" className="mt-3">
        {t("sub.footer")}
      </Text>
    </Screen>
  );
}
