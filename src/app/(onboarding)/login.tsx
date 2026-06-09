import { useRouter } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { GradientButton } from "../../components/GradientButton";
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
      // Ensure there's at least one user to sign in as.
      if (users.length === 0) {
        const res = await seed({});
        signIn(res?.userId);
      } else {
        signIn(); // defaults to the first seeded user (Karolina)
      }
      router.replace("/going");
    } catch (e) {
      Alert.alert("Couldn't sign in", String((e as Error).message));
    }
  }

  const OauthButton = ({ label }: { label: string }) => (
    <Pressable
      onPress={enter}
      className="rounded-2xl border border-brand-evergreen/15 bg-surface py-4 items-center mb-2"
    >
      <Text className="text-brand-evergreen text-[15px] font-semibold">{label}</Text>
    </Pressable>
  );

  return (
    <Screen scroll={false}>
      <View className="flex-1 justify-center">
        <Text className="text-brand-evergreen text-[34px] font-black tracking-tight">
          Welcome! Glad you're here.
        </Text>
        <Text className="text-brand-evergreen/65 text-[16px] mt-3 leading-6">
          Lutek helps your crew meet up more often, without the chaos.
        </Text>
      </View>
      <View className="pb-4">
        <OauthButton label="Continue with Apple" />
        <OauthButton label="Continue with Google" />
        <OauthButton label="Continue with email" />
        <View className="mt-3">
          <GradientButton
            label={isLoading ? "Connecting…" : "Let's go"}
            onPress={enter}
            disabled={isLoading}
          />
        </View>
        <Text className="text-brand-evergreen/35 text-[11px] text-center mt-3">
          Mock sign-in — no account needed in this build.
        </Text>
      </View>
    </Screen>
  );
}
