import { Redirect } from "expo-router";
import { View } from "react-native";
import { ActivityIndicator } from "react-native";
import { useAuth } from "../providers/MockAuthProvider";

// Entry gate: signed in → meetups (home); otherwise → onboarding/login.
export default function Index() {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-canvas items-center justify-center">
        <ActivityIndicator color="#5DA802" />
      </View>
    );
  }
  return <Redirect href={isSignedIn ? "/going" : "/welcome"} />;
}
