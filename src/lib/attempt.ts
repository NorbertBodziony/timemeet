import { Alert } from "react-native";
import { ConvexError } from "convex/values";
import { warn } from "./haptics";
import { t } from "./i18n";

// Run a mutation and surface failures instead of swallowing them. The backend
// throws ConvexError with calm, user-facing messages ("Someone's already
// bringing that.") — show those verbatim; anything else gets a generic line
// that never blames the user (copy law).
export function errorMessage(e: unknown): string {
  if (e instanceof ConvexError) {
    const data = e.data as unknown;
    // Server errors carry a translation key: { k: "errors.…" }.
    if (data && typeof data === "object" && "k" in data) {
      return t(String((data as { k: string }).k));
    }
    if (typeof data === "string") return data; // legacy plain message
  }
  return t("errors.generic");
}

export async function attempt(action: () => Promise<unknown>): Promise<boolean> {
  try {
    await action();
    return true;
  } catch (e) {
    warn();
    Alert.alert(t("errors.title"), errorMessage(e));
    return false;
  }
}
