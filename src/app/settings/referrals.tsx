import { useState } from "react";
import { Alert, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Input, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../providers/MockAuthProvider";

const STEPS = [
  "Share your code with a friend.",
  "They join and RSVP to their first meetup.",
  "You both get a free extra event.",
];

export default function Referrals() {
  const { currentUser } = useAuth();
  const stats = useQuery(
    api.referrals.myStats,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const setReferredBy = useMutation(api.referrals.setReferredBy);
  const [code, setCode] = useState("");

  function share() {
    Alert.alert("Share (mock)", `Join me on MeetTime — code ${stats?.code ?? ""}`);
  }

  async function submitReferredBy() {
    if (!currentUser || !code.trim()) return;
    try {
      await setReferredBy({ userId: currentUser._id, code: code.trim() });
      setCode("");
      Alert.alert("Thanks!", "We've noted who invited you.");
    } catch (e) {
      Alert.alert("Hmm", String((e as Error).message));
    }
  }

  return (
    <Screen title="Refer a friend" subtitle="Bring your crew. Everyone wins.">
      <View className="rounded-2xl bg-surface border border-border px-4 py-4 mb-5 items-center">
        <Text type="body-xs" weight="semibold" color="muted">
          YOUR CODE
        </Text>
        <Text type="h2" weight="bold" className="mt-1">
          {stats?.code ?? "—"}
        </Text>
        {!!stats && (
          <Text type="body-xs" color="muted" className="mt-1">
            {stats.activated} joined · {stats.total} invited
          </Text>
        )}
      </View>

      {STEPS.map((s, i) => (
        <Text key={i} type="body-sm" color="muted" className="mb-1.5">
          {i + 1}. {s}
        </Text>
      ))}

      <View className="mt-5">
        <PrimaryButton label="Share my code" onPress={share} />
      </View>

      <Text type="body-sm" weight="semibold" color="muted" className="mb-1.5 mt-7">
        Were you referred?
      </Text>
      <Input value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="MEETTIME-NAME-XXX" />
      <View className="mt-2">
        <PrimaryButton label="Add code" onPress={submitReferredBy} disabled={!code.trim()} />
      </View>
    </Screen>
  );
}
