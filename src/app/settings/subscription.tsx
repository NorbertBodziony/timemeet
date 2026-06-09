import { Alert, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Card, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { Icon } from "../../components/Icon";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../providers/MockAuthProvider";

const PLUS_BENEFITS = [
  "Unlimited events",
  "Unlimited crew size",
  "Friend reliability stats",
  "Export history (PDF/CSV)",
  "Partner discounts 15–20%",
];

export default function Subscription() {
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
      Alert.alert("You're on MeetTime+", "Mock upgrade — no charge in this build.");
    }
  }

  return (
    <Screen title="MeetTime+" subtitle="Power and convenience. The basics stay free.">
      <Card className="mb-4">
        <Card.Body className="flex-row items-center gap-3">
          <View className="h-10 w-10 rounded-xl bg-accent-soft items-center justify-center">
            <Icon name="star" size={20} tint="accent" />
          </View>
          <View className="flex-1">
            <Text type="body-xs" weight="semibold" color="muted">
              CURRENT PLAN
            </Text>
            <Text type="h3" weight="bold">
              {plan === "free" ? "Free" : plan === "founder" ? "Founder Edition" : "MeetTime+"}
            </Text>
          </View>
        </Card.Body>
      </Card>

      <Card className="mb-5">
        <Card.Body>
          <Text type="h3" weight="bold" className="mb-3">
            MeetTime+
          </Text>
          {PLUS_BENEFITS.map((b) => (
            <View key={b} className="flex-row items-center gap-2 mb-2">
              <Icon name="checkmark-circle" size={18} tint="success" />
              <Text type="body-sm">{b}</Text>
            </View>
          ))}
          <Text type="body-sm" color="muted" className="mt-1">
            14.99 zł / month
          </Text>
        </Card.Body>
      </Card>

      {isPlus ? (
        <PrimaryButton label="Switch to Free" variant="outline" onPress={() => choose("free")} />
      ) : (
        <PrimaryButton label="Upgrade to MeetTime+" onPress={() => choose("meettime_plus")} />
      )}
      <Text type="body-xs" color="muted" align="center" className="mt-3">
        Voting is always free. Free trial covers your first 3 plans.
      </Text>
    </Screen>
  );
}
