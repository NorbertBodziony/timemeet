import { useRouter } from "expo-router";
import { OnboardingSlide } from "../../components/OnboardingSlide";
import { useT } from "../../providers/LanguageProvider";

// Cold onboarding, screen 2 of 3.
export default function HowTimePoll() {
  const { t } = useT();
  const router = useRouter();
  return (
    <OnboardingSlide
      index={1}
      total={3}
      icon="calendar-outline"
      headline={t("onb.slide2Title")}
      body={t("onb.slide2Body")}
      cta={t("onb.slide2Cta")}
      onNext={() => router.push("/how-place-rsvp")}
    />
  );
}
