import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, View } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useMutation } from "convex/react";
import { Button, Text } from "heroui-native";
import { api } from "../../../convex/_generated/api";
import { IconTile } from "../../components/IconTile";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { appleSignIn } from "../../lib/auth";
import { TITLE_TRACKING } from "../../lib/ui";
import { useAuth } from "../../providers/MockAuthProvider";
import { errorMessage } from "../../lib/attempt";

// Login (docs §3.8). Apple uses real Sign-In where available (native build),
// falling back to a seeded mock session in Expo Go so the demo always works.
export default function Login() {
  const router = useRouter();
  // RSVP-first invited flow: the invite screen sends users here with a `next`
  // param; after auth we land them back to finish their RSVP.
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { signIn, users, isLoading } = useAuth();
  const seed = useMutation(api.seed.run);
  const upsert = useMutation(api.users.upsertFromAuth);

  const dest = (next as never) ?? ("/going" as never);

  // Show Apple's official button only where Sign in with Apple is available
  // (real iOS builds). Elsewhere we fall back to the mock entry buttons.
  const [appleAvailable, setAppleAvailable] = useState(false);
  useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
    }
  }, []);

  // Mock entry — seed a user if the DB is empty, then sign in.
  async function enter() {
    try {
      if (users.length === 0) {
        const res = await seed({});
        signIn(res?.userId);
      } else {
        signIn();
      }
      router.replace(dest);
    } catch (e) {
      Alert.alert("Couldn't sign in", errorMessage(e));
    }
  }

  // Real Apple Sign-In when available; otherwise fall back to the mock entry.
  async function withApple() {
    const id = await appleSignIn();
    if (!id) return enter();
    try {
      const userId = await upsert(id);
      signIn(userId);
      router.replace(dest);
    } catch (e) {
      Alert.alert("Couldn't sign in", errorMessage(e));
    }
  }

  return (
    <Screen scroll={false}>
      <View className="flex-1 justify-center">
        <View className="mb-7">
          <IconTile name="people" size="lg" />
        </View>
        <Text
          type="h1"
          weight="bold"
          className="text-4xl leading-tight"
          style={{ letterSpacing: TITLE_TRACKING }}
        >
          Welcome! Glad you're here.
        </Text>
        <Text color="muted" className="mt-4 text-base leading-6">
          Lutek helps your crew meet up more often, without the chaos.
        </Text>
      </View>
      <View className="pb-4 gap-2">
        {appleAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={28}
            style={{ height: 52 }}
            onPress={withApple}
          />
        ) : (
          <Button variant="outline" size="lg" onPress={withApple}>
            <Button.Label>Continue with Apple</Button.Label>
          </Button>
        )}
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
          {appleAvailable
            ? "Apple sign-in is live. Google & email are mock for now."
            : "Mock sign-in — no account needed in this build."}
        </Text>
      </View>
    </Screen>
  );
}
