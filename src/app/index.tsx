import { Redirect } from "expo-router";
import { View } from "react-native";
import { Spinner } from "heroui-native";
import { useAuth } from "../providers/MockAuthProvider";

// Entry gate: signed in → meetups (home); otherwise → onboarding/login.
export default function Index() {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Spinner />
      </View>
    );
  }
  return <Redirect href={(isSignedIn ? "/events" : "/welcome") as never} />;
}
