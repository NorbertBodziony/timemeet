import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { useMutation } from "convex/react";
import { Card, Input, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../providers/MockAuthProvider";

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
      Alert.alert("Couldn't save", String((e as Error).message));
      setBusy(false);
    }
  }

  const label = "mb-1.5";

  return (
    <Screen title="Your profile" dismiss="back">
      <Text type="body-sm" weight="semibold" color="muted" className={label}>
        Name
      </Text>
      <Input value={name} onChangeText={setName} placeholder="Karolina" />

      <Text type="body-sm" weight="semibold" color="muted" className="mb-1.5 mt-5">
        City
      </Text>
      <Input value={city} onChangeText={setCity} placeholder="Kraków" />

      <Text type="body-sm" weight="semibold" color="muted" className="mb-1.5 mt-5">
        Referral code
      </Text>
      <Card className="mb-6">
        <Card.Body>
          <Text color="muted">{currentUser?.referralCode ?? "—"}</Text>
        </Card.Body>
      </Card>

      <PrimaryButton label="Save" onPress={save} disabled={!name.trim()} loading={busy} />
    </Screen>
  );
}
