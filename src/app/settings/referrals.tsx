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
import { warn } from "../../lib/haptics";
import { errorMessage } from "../../lib/attempt";

const STEPS: { icon: "share-outline" | "person-add-outline" | "gift-outline"; text: string }[] = [
  { icon: "share-outline", text: "Share your code with a friend." },
  { icon: "person-add-outline", text: "They join and RSVP to their first meetup." },
  { icon: "gift-outline", text: "You both get a free extra event." },
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
    Share.share({
      message: `Join me on MeetTime — use my code ${stats?.code ?? ""}`,
    }).catch(() => {});
  }

  async function submitReferredBy() {
    if (!currentUser || !code.trim()) return;
    try {
      await setReferredBy({ userId: currentUser._id, code: code.trim() });
      setCode("");
      Alert.alert("Thanks!", "We've noted who invited you.");
    } catch (e) {
      warn();
      Alert.alert("Hmm", errorMessage(e));
    }
  }

  return (
    <Screen title="Refer a friend" subtitle="Bring your crew. Everyone wins." dismiss="back">
      <Card className="mb-5">
        <Card.Body className="items-center py-5">
          <Icon name="gift" size={28} tint="accent" />
          <Text type="body-xs" weight="semibold" color="muted" className="mt-2">
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
        </Card.Body>
      </Card>

      {STEPS.map((s, i) => (
        <View key={i} className="flex-row items-center gap-3 mb-3">
          <View className="h-8 w-8 rounded-full bg-accent-soft items-center justify-center">
            <Icon name={s.icon} size={16} tint="accent" />
          </View>
          <Text type="body-sm" className="flex-1">
            {s.text}
          </Text>
        </View>
      ))}

      <View className="mt-3">
        <PrimaryButton label="Share my code" onPress={share} />
      </View>

      <FormLabel className="mt-7">Were you referred?</FormLabel>
      <Input value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="MEETTIME-NAME-XXX" />
      <View className="mt-2">
        <PrimaryButton label="Add code" onPress={submitReferredBy} disabled={!code.trim()} />
      </View>
    </Screen>
  );
}
