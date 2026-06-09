import { View } from "react-native";
import { Text } from "heroui-native";
import { PrimaryButton } from "./PrimaryButton";
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
        <Text type="h1" weight="bold" className="text-4xl leading-tight">
          {headline}
        </Text>
        <Text color="muted" className="mt-4 text-base leading-6">
          {body}
        </Text>
      </View>
      <View className="pb-4">
        <View className="flex-row justify-center gap-2 mb-5">
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full ${i === index ? "w-[18px] bg-accent" : "w-2 bg-default"}`}
            />
          ))}
        </View>
        <PrimaryButton label={cta} onPress={onNext} />
      </View>
    </Screen>
  );
}
