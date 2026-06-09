import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { useMutation } from "convex/react";
import { Card, Input, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { FormLabel } from "../../components/FormLabel";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../providers/MockAuthProvider";
import { errorMessage } from "../../lib/attempt";

export default function Profile() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const update = useMutation(api.users.update);

  const [name, setName] = useState(currentUser?.displayName ?? "");
  const [city, setCity] = useState(currentUser?.city ?? "Kraków");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!currentUser || !name.trim()) return;
    setBusy(true);
    try {
      await update({ userId: currentUser._id, patch: { displayName: name.trim(), city: city.trim() } });
      router.back();
    } catch (e) {
      Alert.alert("Couldn't save", errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <Screen title="Your profile" dismiss="back">
      <FormLabel>Name</FormLabel>
      <Input value={name} onChangeText={setName} placeholder="Karolina" />

      <FormLabel className="mt-5">City</FormLabel>
      <Input value={city} onChangeText={setCity} placeholder="Kraków" />

      <FormLabel className="mt-5">Referral code</FormLabel>
      <Card className="mb-6">
        <Card.Body>
          <Text color="muted">{currentUser?.referralCode ?? "—"}</Text>
        </Card.Body>
      </Card>

      <PrimaryButton label="Save" onPress={save} disabled={!name.trim()} loading={busy} />
    </Screen>
  );
}
