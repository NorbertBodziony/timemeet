import { useRouter } from "expo-router";
import { OnboardingSlide } from "../../components/OnboardingSlide";
import { useT } from "../../providers/LanguageProvider";

// Cold onboarding, screen 1 of 3 (docs §3.8 / §5).
export default function Welcome() {
  const { t } = useT();
  const router = useRouter();
  return (
    <OnboardingSlide
      index={0}
      total={3}
      icon="people-outline"
      headline={t("onb.slide1Title")}
      body={t("onb.slide1Body")}
      cta={t("onb.slide1Cta")}
      onNext={() => router.push("/how-time-poll")}
    />
  );
}
