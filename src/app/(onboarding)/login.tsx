import { useRouter } from "expo-router";
import { Alert, View } from "react-native";
import { useMutation } from "convex/react";
import { Button, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../providers/MockAuthProvider";

// Mock login (docs §3.8). OAuth/email buttons are no-ops that establish a mock
// session and seed a user if the DB is empty. Real OAuth drops in here later.
export default function Login() {
  const router = useRouter();
  const { signIn, users, isLoading } = useAuth();
  const seed = useMutation(api.seed.run);

  async function enter() {
    try {
      if (users.length === 0) {
        const res = await seed({});
        signIn(res?.userId);
      } else {
        signIn();
      }
      router.replace("/going");
    } catch (e) {
      Alert.alert("Couldn't sign in", String((e as Error).message));
    }
  }

  return (
    <Screen scroll={false}>
      <View className="flex-1 justify-center">
        <Text type="h1" weight="bold" className="text-3xl">
          Welcome! Glad you're here.
        </Text>
        <Text color="muted" className="mt-3 text-base leading-6">
          Lutek helps your crew meet up more often, without the chaos.
        </Text>
      </View>
      <View className="pb-4 gap-2">
        <Button variant="outline" size="lg" onPress={enter}>
          <Button.Label>Continue with Apple</Button.Label>
        </Button>
        <Button variant="outline" size="lg" onPress={enter}>
          <Button.Label>Continue with Google</Button.Label>
        </Button>
        <Button variant="outline" size="lg" onPress={enter}>
          <Button.Label>Continue with email</Button.Label>
        </Button>
        <View className="mt-3">
          <PrimaryButton
            label={isLoading ? "Connecting…" : "Let's go"}
            onPress={enter}
            disabled={isLoading}
          />
        </View>
        <Text type="body-xs" color="muted" align="center" className="mt-3">
          Mock sign-in — no account needed in this build.
        </Text>
      </View>
    </Screen>
  );
}
