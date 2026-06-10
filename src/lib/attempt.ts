import { Alert } from "react-native";
import { ConvexError } from "convex/values";
import { warn } from "./haptics";

// Run a mutation and surface failures instead of swallowing them. The backend
// throws ConvexError with calm, user-facing messages ("Someone's already
// bringing that.") — show those verbatim; anything else gets a generic line
// that never blames the user (copy law).
export function errorMessage(e: unknown): string {
  return e instanceof ConvexError && typeof e.data === "string"
    ? e.data
    : "That didn't go through — give it another try.";
}

export async function attempt(action: () => Promise<unknown>): Promise<boolean> {
  try {
    await action();
    return true;
  } catch (e) {
    warn();
    Alert.alert("Couldn't do that", errorMessage(e));
    return false;
  }
}
