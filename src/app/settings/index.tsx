import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import Constants from "expo-constants";
import { Chip, Text } from "heroui-native";
import { Screen } from "../../components/Screen";
import { SettingsRow } from "../../components/SettingsRow";
import { useAuth } from "../../providers/MockAuthProvider";

export default function SettingsHome() {
  const router = useRouter();
  const { currentUser, users, switchUser, signOut } = useAuth();

  return (
    <Screen title="Settings">
      <View className="rounded-2xl bg-surface border border-border px-4 py-4 mb-5">
        <Text type="h3" weight="bold">
          {currentUser?.displayName ?? "—"}
        </Text>
        <Text type="body-xs" color="muted" className="mt-0.5">
          {currentUser?.referralCode ?? ""}
        </Text>
      </View>

      <SettingsRow label="Profile" onPress={() => router.push("/settings/profile")} />
      <SettingsRow label="Notifications" onPress={() => router.push("/settings/notifications")} />
      <SettingsRow label="MeetTime+" onPress={() => router.push("/settings/subscription")} />
      <SettingsRow label="Refer a friend" onPress={() => router.push("/settings/referrals")} />
      <SettingsRow label="Privacy & data" onPress={() => router.push("/settings/privacy")} />

      {/* Dev-only: switch the mock user to exercise other flows. */}
      {users.length > 1 && (
        <View className="mt-6">
          <Text type="body-xs" weight="semibold" color="muted" className="mb-2">
            Switch user (dev)
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {users.map((u) => (
              <Chip
                key={u._id}
                color="accent"
                variant={u._id === currentUser?._id ? "primary" : "tertiary"}
                size="sm"
                onPress={() => switchUser(u._id)}
              >
                <Chip.Label>{u.displayName}</Chip.Label>
              </Chip>
            ))}
          </View>
        </View>
      )}

      <Pressable
        onPress={() => {
          signOut();
          router.replace("/welcome");
        }}
        className="mt-8 py-3 items-center"
      >
        <Text weight="semibold" className="text-danger">
          Sign out
        </Text>
      </Pressable>
      <Text type="body-xs" color="muted" align="center" className="mt-2">
        MeetTime v{Constants.expoConfig?.version ?? "1.0.0"}
      </Text>
    </Screen>
  );
}
