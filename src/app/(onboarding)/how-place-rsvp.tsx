import { useRouter } from "expo-router";
import { OnboardingSlide } from "../../components/OnboardingSlide";

// Cold onboarding, screen 3 of 3.
export default function HowPlaceRsvp() {
  const router = useRouter();
  return (
    <OnboardingSlide
      index={2}
      total={3}
      headline="Place works? You in?"
      body="The app collects, you meet up."
      cta="Let's go"
      onNext={() => router.replace("/going")}
    />
  );
}
