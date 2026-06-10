import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useMutation } from "convex/react";
import { Card, Input, Spinner, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { FormLabel } from "../../components/FormLabel";
import { Icon } from "../../components/Icon";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { UserAvatar } from "../../components/UserAvatar";
import { attempt, errorMessage } from "../../lib/attempt";
import { success, tap, warn } from "../../lib/haptics";
import { pickImages, uploadImage } from "../../lib/photos";
import { useAuth } from "../../providers/MockAuthProvider";

export default function Profile() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const update = useMutation(api.users.update);
  const uploadUrl = useMutation(api.posts.generateUploadUrl);
  const setPhoto = useMutation(api.users.setPhoto);

  const [name, setName] = useState(currentUser?.displayName ?? "");
  const [city, setCity] = useState(currentUser?.city ?? "Kraków");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function changePhoto() {
    if (!currentUser || uploading) return;
    tap();
    const uris = await pickImages();
    if (uris.length === 0) return;
    setUploading(true);
    try {
      const ok = await attempt(async () => {
        const url = await uploadUrl({ userId: currentUser._id });
        const storageId = await uploadImage(uris[0], url);
        await setPhoto({ userId: currentUser._id, storageId: storageId as never });
      });
      if (ok) success();
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!currentUser || !name.trim()) return;
    setBusy(true);
    try {
      await update({ userId: currentUser._id, patch: { displayName: name.trim(), city: city.trim() } });
      router.back();
    } catch (e) {
      warn();
      Alert.alert("Couldn't save", errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <Screen title="Your profile" dismiss="back">
      {/* Profile photo — tap to take or choose one. */}
      <View className="items-center mb-6">
        <Pressable onPress={changePhoto} hitSlop={8}>
          <UserAvatar
            name={currentUser?.displayName}
            photoUrl={currentUser?.photoUrl}
            size="lg"
          />
          <View className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent items-center justify-center border-2 border-background">
            {uploading ? (
              <Spinner size="sm" color="#FFFFFF" />
            ) : (
              <Icon name="camera" size={14} color="#FFFFFF" />
            )}
          </View>
        </Pressable>
        <Text type="body-xs" color="muted" className="mt-2">
          Tap to change your photo
        </Text>
      </View>

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
