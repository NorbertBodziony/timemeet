import { useRouter } from "expo-router";
import { Alert, View } from "react-native";
import { useMutation } from "convex/react";
import { Button, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { Icon } from "../../components/Icon";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { appleSignIn } from "../../lib/auth";
import { useAuth } from "../../providers/MockAuthProvider";

// Login (docs §3.8). Apple uses real Sign-In where available (native build),
// falling back to a seeded mock session in Expo Go so the demo always works.
export default function Login() {
  const router = useRouter();
  const { signIn, users, isLoading } = useAuth();
  const seed = useMutation(api.seed.run);
  const upsert = useMutation(api.users.upsertFromAuth);

  // Mock entry — seed a user if the DB is empty, then sign in.
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

  // Real Apple Sign-In when available; otherwise fall back to the mock entry.
  async function withApple() {
    const id = await appleSignIn();
    if (!id) return enter();
    try {
      const userId = await upsert(id);
      signIn(userId);
      router.replace("/going");
    } catch (e) {
      Alert.alert("Couldn't sign in", String((e as Error).message));
    }
  }

  return (
    <Screen scroll={false}>
      <View className="flex-1 justify-center">
        <View className="h-16 w-16 rounded-2xl bg-accent items-center justify-center mb-7">
          <Icon name="people" size={30} color="#FFFFFF" />
        </View>
        <Text type="h1" weight="bold" className="text-3xl">
          Welcome! Glad you're here.
        </Text>
        <Text color="muted" className="mt-3 text-base leading-6">
          Lutek helps your crew meet up more often, without the chaos.
        </Text>
      </View>
      <View className="pb-4 gap-2">
        <Button variant="outline" size="lg" onPress={withApple}>
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
