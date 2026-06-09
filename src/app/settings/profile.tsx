import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { GradientButton } from "../../components/GradientButton";
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

  const label = "text-brand-evergreen/65 text-[13px] mb-1.5 font-semibold";
  const input =
    "rounded-2xl bg-surface border border-brand-evergreen/15 px-4 py-3.5 text-[16px] text-brand-evergreen mb-5";

  return (
    <Screen title="Your profile">
      <Text className={label}>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Karolina"
        placeholderTextColor="rgba(15,26,0,0.35)"
        className={input}
      />
      <Text className={label}>City</Text>
      <TextInput
        value={city}
        onChangeText={setCity}
        placeholder="Kraków"
        placeholderTextColor="rgba(15,26,0,0.35)"
        className={input}
      />
      <Text className={label}>Referral code</Text>
      <View className="rounded-2xl bg-surface border border-brand-evergreen/10 px-4 py-3.5 mb-6">
        <Text className="text-brand-evergreen/55 text-[15px]">
          {currentUser?.referralCode ?? "—"}
        </Text>
      </View>
      <GradientButton label="Save" onPress={save} disabled={!name.trim()} loading={busy} />
    </Screen>
  );
}
