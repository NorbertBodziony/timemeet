import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { GradientButton } from "../../components/GradientButton";
import { Screen } from "../../components/Screen";

// Cold onboarding, screen 1 (docs §3.8 / §5). Lutek appears here.
export default function Welcome() {
  const router = useRouter();
  return (
    <Screen scroll={false}>
      <View className="flex-1 justify-center">
        <Text className="text-brand-evergreen text-[42px] font-black leading-tight tracking-tight">
          Less planning.{"\n"}More meetups.
        </Text>
        <Text className="text-brand-evergreen/65 text-[16px] mt-4 leading-6">
          People are in. No date yet. We've got this.
        </Text>
      </View>
      <View className="pb-4">
        <GradientButton
          label="Let's go"
          onPress={() => router.replace("/going")}
        />
      </View>
    </Screen>
  );
}
