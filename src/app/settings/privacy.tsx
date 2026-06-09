import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Button, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { Screen } from "../../components/Screen";
import { ToggleRow } from "../../components/SettingsRow";
import { useAuth } from "../../providers/MockAuthProvider";

export default function Privacy() {
  const router = useRouter();
  const { currentUser, signOut } = useAuth();
  const me = useQuery(api.users.get, currentUser ? { userId: currentUser._id } : "skip");
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
      <ToggleRow label="Share anonymous usage analytics" value={optIn} onValueChange={toggleOptIn} />
      <Text type="body-xs" color="muted" className="mt-1 mb-6">
        Off by default. Only metadata — never your names, addresses, or messages.
      </Text>

      <Button variant="danger" size="md" onPress={confirmDelete}>
        <Button.Label>Delete account</Button.Label>
      </Button>
    </Screen>
  );
}
