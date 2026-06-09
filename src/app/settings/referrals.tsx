import { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { GradientButton } from "../../components/GradientButton";
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
      <View className="rounded-2xl bg-surface border border-brand-evergreen/10 px-4 py-4 mb-5 items-center">
        <Text className="text-brand-evergreen/45 text-[12px] font-semibold">YOUR CODE</Text>
        <Text className="text-brand-evergreen text-[20px] font-bold mt-1">
          {stats?.code ?? "—"}
        </Text>
        {!!stats && (
          <Text className="text-brand-evergreen/45 text-[12px] mt-1">
            {stats.activated} joined · {stats.total} invited
          </Text>
        )}
      </View>

      {STEPS.map((s, i) => (
        <Text key={i} className="text-brand-evergreen/65 text-[14px] mb-1.5">
          {i + 1}. {s}
        </Text>
      ))}

      <View className="mt-5">
        <GradientButton label="Share my code" onPress={share} />
      </View>

      <Text className="text-brand-evergreen/65 text-[13px] mb-1.5 mt-7 font-semibold">
        Were you referred?
      </Text>
      <View className="flex-row gap-2">
        <TextInput
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          placeholder="MEETTIME-NAME-XXX"
          placeholderTextColor="rgba(15,26,0,0.35)"
          className="flex-1 rounded-xl bg-surface border border-brand-evergreen/15 px-3 py-2.5 text-[14px] text-brand-evergreen"
        />
      </View>
      <View className="mt-2">
        <GradientButton label="Add code" onPress={submitReferredBy} disabled={!code.trim()} />
      </View>
    </Screen>
  );
}
