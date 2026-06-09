import { Redirect } from "expo-router";

// First slice entry: go straight to the meetups list. (Onboarding lives in
// (onboarding)/ and is reachable; gating logic comes with real auth later.)
export default function Index() {
  return <Redirect href="/going" />;
}
