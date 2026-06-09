import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Constants from "expo-constants";
import { Screen } from "../../components/Screen";
import { SettingsRow } from "../../components/SettingsRow";
import { useAuth } from "../../providers/MockAuthProvider";

export default function SettingsHome() {
  const router = useRouter();
  const { currentUser, users, switchUser, signOut } = useAuth();

  return (
    <Screen title="Settings">
      {/* Current user */}
      <View className="rounded-2xl bg-surface border border-brand-evergreen/10 px-4 py-4 mb-5">
        <Text className="text-brand-evergreen text-[17px] font-bold">
          {currentUser?.displayName ?? "—"}
        </Text>
        <Text className="text-brand-evergreen/45 text-[12px] mt-0.5">
          {currentUser?.referralCode ?? ""}
        </Text>
      </View>

      <SettingsRow label="Profile" onPress={() => router.push("/settings/profile")} />
      <SettingsRow
        label="Notifications"
        onPress={() => router.push("/settings/notifications")}
      />
      <SettingsRow
        label="MeetTime+"
        onPress={() => router.push("/settings/subscription")}
      />
      <SettingsRow
        label="Refer a friend"
        onPress={() => router.push("/settings/referrals")}
      />
      <SettingsRow
        label="Privacy & data"
        onPress={() => router.push("/settings/privacy")}
      />

      {/* Dev-only: switch the mock user to exercise other flows. */}
      {users.length > 1 && (
        <View className="mt-6">
          <Text className="text-brand-evergreen/45 text-[12px] font-semibold mb-2">
            Switch user (dev)
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {users.map((u) => {
              const on = u._id === currentUser?._id;
              return (
                <Pressable
                  key={u._id}
                  onPress={() => switchUser(u._id)}
                  className="rounded-full border px-3 py-1.5"
                  style={{
                    backgroundColor: on ? "#0F1A00" : "#FFFFFF",
                    borderColor: on ? "#0F1A00" : "rgba(15,26,0,0.12)",
                  }}
                >
                  <Text style={{ color: on ? "#FAFFF2" : "#0F1A00", fontSize: 13 }}>
                    {u.displayName}
                  </Text>
                </Pressable>
              );
            })}
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
        <Text className="text-semantic-danger text-[15px] font-semibold">Sign out</Text>
      </Pressable>
      <Text className="text-brand-evergreen/30 text-[11px] text-center mt-2">
        MeetTime v{Constants.expoConfig?.version ?? "1.0.0"}
      </Text>
    </Screen>
  );
}
