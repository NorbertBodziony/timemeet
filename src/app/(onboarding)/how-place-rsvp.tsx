import { useRouter } from "expo-router";
import { OnboardingSlide } from "../../components/OnboardingSlide";
import { useT } from "../../providers/LanguageProvider";

// Cold onboarding, screen 3 of 3.
export default function HowPlaceRsvp() {
  const { t } = useT();
  const router = useRouter();
  return (
    <OnboardingSlide
      index={2}
      total={3}
      icon="location-outline"
      headline={t("onb.slide3Title")}
      body={t("onb.slide3Body")}
      cta={t("onb.slide3Cta")}
      onNext={() => router.push("/login")}
    />
  );
}
