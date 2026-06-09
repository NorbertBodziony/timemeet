import { View } from "react-native";
import { Text } from "heroui-native";
import { IconTile } from "./IconTile";
import { PrimaryButton } from "./PrimaryButton";
import { Screen } from "./Screen";
import { TITLE_TRACKING } from "../lib/ui";
import type { IconName } from "../lib/icons";

// One cold-onboarding screen (docs §3.8 / §5). Icon + headline, light dot indicator.
export function OnboardingSlide({
  index,
  total,
  icon,
  headline,
  body,
  cta,
  onNext,
}: {
  index: number;
  total: number;
  icon: IconName;
  headline: string;
  body: string;
  cta: string;
  onNext: () => void;
}) {
  return (
    <Screen scroll={false}>
      <View className="flex-1 justify-center">
        <View className="mb-7">
          <IconTile name={icon} size="lg" />
        </View>
        <Text
          type="h1"
          weight="bold"
          className="text-4xl leading-tight"
          style={{ letterSpacing: TITLE_TRACKING }}
        >
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
