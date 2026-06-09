import { Alert, Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { GradientButton } from "../../components/GradientButton";
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
      <View className="rounded-2xl bg-surface border border-brand-evergreen/10 px-4 py-3 mb-5">
        <Text className="text-brand-evergreen/45 text-[12px] font-semibold">CURRENT PLAN</Text>
        <Text className="text-brand-evergreen text-[17px] font-bold mt-1">
          {plan === "free" ? "Free" : plan === "founder" ? "Founder Edition" : "MeetTime+"}
        </Text>
      </View>

      <View className="rounded-2xl bg-surface border border-brand-evergreen/10 px-4 py-4 mb-5">
        <Text className="text-brand-evergreen text-[17px] font-bold mb-2">MeetTime+</Text>
        {PLUS_BENEFITS.map((b) => (
          <Text key={b} className="text-brand-evergreen/65 text-[14px] mb-1">
            ✓ {b}
          </Text>
        ))}
        <Text className="text-brand-evergreen/45 text-[13px] mt-2">14.99 zł / month</Text>
      </View>

      {isPlus ? (
        <GradientButton label="Switch to Free" onPress={() => choose("free")} />
      ) : (
        <GradientButton label="Upgrade to MeetTime+" onPress={() => choose("meettime_plus")} />
      )}
      <Text className="text-brand-evergreen/40 text-[12px] text-center mt-3">
        Voting is always free. Free trial covers your first 3 plans.
      </Text>
    </Screen>
  );
}
