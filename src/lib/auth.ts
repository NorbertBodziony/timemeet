import * as AppleAuthentication from "expo-apple-authentication";

// Real-auth seam (docs §12). `appleSignIn` returns an identity in a native build
// where Apple Sign-In is available; in Expo Go (or on cancel) it returns null and
// the caller falls back to the mock session — so the demo keeps working.
//
// Google/email: add an expo-auth-session provider here with a client id from env
// and the same { authSubject, displayName, email } shape. Then map to a Convex
// user via api.users.upsertFromAuth.

export type AuthIdentity = {
  authSubject: string;
  displayName: string;
  email?: string;
};

export async function appleSignIn(): Promise<AuthIdentity | null> {
  try {
    if (!(await AppleAuthentication.isAvailableAsync())) return null;
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    const name = [cred.fullName?.givenName, cred.fullName?.familyName]
      .filter(Boolean)
      .join(" ");
    return {
      authSubject: cred.user,
      displayName: name || "Friend",
      email: cred.email ?? undefined,
    };
  } catch {
    return null; // unavailable (Expo Go) or cancelled → fall back to mock
  }
}
