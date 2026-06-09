import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Screen } from "../../components/Screen";
import { ToggleRow } from "../../components/SettingsRow";
import { useAuth } from "../../providers/MockAuthProvider";

export default function Privacy() {
  const router = useRouter();
  const { currentUser, signOut } = useAuth();
  const me = useQuery(
    api.users.get,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const setOptIn = useMutation(api.users.setAnalyticsOptIn);
  const deleteAccount = useMutation(api.users.deleteAccount);
  const [optIn, setOptInLocal] = useState(false);

  useEffect(() => {
    if (me) setOptInLocal(me.analyticsOptIn ?? false);
  }, [me]);

  function toggleOptIn(v: boolean) {
    if (!currentUser) return;
    setOptInLocal(v);
    setOptIn({ userId: currentUser._id, value: v });
  }

  // Multi-step delete (RODO §38) — soft delete + 30-day grace.
  function confirmDelete() {
    Alert.alert("Delete your account?", "Your data is removed after a 30-day grace period.", [
      { text: "Keep account", style: "cancel" },
      {
        text: "Continue",
        style: "destructive",
        onPress: () =>
          Alert.alert("Are you sure?", "This can't be undone.", [
            { text: "Keep account", style: "cancel" },
            {
              text: "Yes, delete",
              style: "destructive",
              onPress: async () => {
                if (!currentUser) return;
                await deleteAccount({ userId: currentUser._id });
                signOut();
                router.replace("/welcome");
              },
            },
          ]),
      },
    ]);
  }

  return (
    <Screen title="Privacy & data">
      <ToggleRow
        label="Share anonymous usage analytics"
        value={optIn}
        onValueChange={toggleOptIn}
      />
      <Text className="text-brand-evergreen/40 text-[12px] mt-1 mb-6">
        Off by default. Only metadata — never your names, addresses, or messages.
      </Text>

      <Pressable
        onPress={confirmDelete}
        className="rounded-2xl border border-semantic-danger/30 py-3.5 items-center"
      >
        <Text className="text-semantic-danger text-[15px] font-semibold">
          Delete account
        </Text>
      </Pressable>
    </Screen>
  );
}
