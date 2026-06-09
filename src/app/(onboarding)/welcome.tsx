import { useRouter } from "expo-router";
import { OnboardingSlide } from "../../components/OnboardingSlide";

// Cold onboarding, screen 1 of 3 (docs §3.8 / §5).
export default function Welcome() {
  const router = useRouter();
  return (
    <OnboardingSlide
      index={0}
      total={3}
      icon="people-outline"
      headline={"Less planning.\nMore meetups."}
      body="People are in. No date yet. We've got this."
      cta="Next"
      onNext={() => router.push("/how-time-poll")}
    />
  );
}
