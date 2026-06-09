import { useRouter } from "expo-router";
import { OnboardingSlide } from "../../components/OnboardingSlide";

// Cold onboarding, screen 2 of 3.
export default function HowTimePoll() {
  const router = useRouter();
  return (
    <OnboardingSlide
      index={1}
      total={3}
      headline="When works?"
      body="Drop some times. Crew taps. Done."
      cta="Next"
      onNext={() => router.push("/how-place-rsvp")}
    />
  );
}
