import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";
import { useMutation } from "convex/react";
import { Input, Text } from "heroui-native";
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
    <Screen title="Your profile">
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
      <View className="rounded-2xl bg-surface border border-border px-4 py-3.5 mb-6">
        <Text color="muted">{currentUser?.referralCode ?? "—"}</Text>
      </View>

      <PrimaryButton label="Save" onPress={save} disabled={!name.trim()} loading={busy} />
    </Screen>
  );
}
