import { Text, View } from "react-native";
import { GradientButton } from "./GradientButton";
import { Screen } from "./Screen";

// One cold-onboarding screen (docs §3.8 / §5). Light dot indicator, no "1 of 3".
export function OnboardingSlide({
  index,
  total,
  headline,
  body,
  cta,
  onNext,
}: {
  index: number;
  total: number;
  headline: string;
  body: string;
  cta: string;
  onNext: () => void;
}) {
  return (
    <Screen scroll={false}>
      <View className="flex-1 justify-center">
        <Text className="text-brand-evergreen text-[38px] font-black leading-tight tracking-tight">
          {headline}
        </Text>
        <Text className="text-brand-evergreen/65 text-[16px] mt-4 leading-6">
          {body}
        </Text>
      </View>
      <View className="pb-4">
        <View className="flex-row justify-center gap-2 mb-5">
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              className="h-2 rounded-full"
              style={{
                width: i === index ? 18 : 8,
                backgroundColor: i === index ? "#5DA802" : "rgba(15,26,0,0.15)",
              }}
            />
          ))}
        </View>
        <GradientButton label={cta} onPress={onNext} />
      </View>
    </Screen>
  );
}
