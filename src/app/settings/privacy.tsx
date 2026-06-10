import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Button, ListGroup, Switch, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { Icon } from "../../components/Icon";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../providers/MockAuthProvider";
import { tap } from "../../lib/haptics";

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
    <Screen title="Privacy & data" dismiss="back">
      <ListGroup>
        <ListGroup.Item>
          <ListGroup.ItemPrefix>
            <Icon name="analytics-outline" size={20} tint="accent" />
          </ListGroup.ItemPrefix>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle>Share anonymous usage analytics</ListGroup.ItemTitle>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix>
            <Switch
              isSelected={optIn}
              onSelectedChange={(v) => {
                tap();
                toggleOptIn(v);
              }}
            />
          </ListGroup.ItemSuffix>
        </ListGroup.Item>
      </ListGroup>
      <Text type="body-xs" color="muted" className="mt-2 mb-6 ml-1">
        Off by default. Only metadata — never your names, addresses, or messages.
      </Text>

      <Button variant="danger" size="md" onPress={confirmDelete}>
        <Button.Label>Delete account</Button.Label>
      </Button>
    </Screen>
  );
}
