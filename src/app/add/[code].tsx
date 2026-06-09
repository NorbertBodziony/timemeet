import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Button, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { EmptyState } from "../../components/EmptyState";
import { Icon } from "../../components/Icon";
import { Screen } from "../../components/Screen";
import { UserAvatar } from "../../components/UserAvatar";
import { useAuth } from "../../providers/MockAuthProvider";
import { usePush } from "../../providers/MockPushProvider";

export default function AddFriend() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { currentUser } = useAuth();
  const push = usePush();

  const preview = useQuery(api.friends.resolveCode, code ? { code } : "skip");
  const addByCode = useMutation(api.friends.addByCode);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const isSelf = preview && currentUser && preview._id === currentUser._id;

  async function add() {
    if (!currentUser || !code || saving) return;
    setSaving(true);
    try {
      const res = await addByCode({ userId: currentUser._id, code });
      setDone(true);
      push.push({
        title: res.alreadyFriends
          ? `You're already friends with ${res.friend.displayName.split(" ")[0]}`
          : `${res.friend.displayName.split(" ")[0]} is now a friend ✨`,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title="Add friend" dismiss="close">
      {preview === undefined ? null : preview === null ? (
        <EmptyState icon="qr-code-outline" text="That code didn't match anyone. Try scanning again." />
      ) : (
        <View className="items-center justify-center py-12 gap-5">
          <UserAvatar name={preview.displayName} size="lg" />
          <View className="items-center gap-1">
            <Text type="h2" weight="bold">
              {preview.displayName}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <Icon name="location-outline" size={14} tint="muted" />
              <Text color="muted">{preview.city}</Text>
            </View>
          </View>

          {done ? (
            <View className="items-center gap-3 mt-4">
              <View className="flex-row items-center gap-2">
                <Icon name="checkmark-circle" size={20} tint="success" />
                <Text weight="semibold" className="text-success">
                  Added to your crew
                </Text>
              </View>
              <Button variant="outline" size="lg" onPress={() => router.replace("/friends")}>
                <Button.Label>See friends</Button.Label>
              </Button>
            </View>
          ) : isSelf ? (
            <Text color="muted" align="center" className="mt-2">
              That's your own code 🙂
            </Text>
          ) : (
            <View className="w-full mt-4 gap-2">
              <Button variant="primary" size="lg" isDisabled={saving} onPress={add}>
                <Icon name="person-add" size={18} color="#FFFFFF" />
                <Button.Label>{saving ? "Adding…" : `Add ${preview.displayName.split(" ")[0]}`}</Button.Label>
              </Button>
              <Button variant="ghost" size="md" onPress={() => router.back()}>
                <Button.Label>Not now</Button.Label>
              </Button>
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}
