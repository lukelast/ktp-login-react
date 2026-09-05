import type { ActionCodeSettings, Auth, AuthProvider, User } from "firebase/auth";
import { getAuthClientConfig } from "../config";

export const MICROSOFT_PROVIDER_ID = "microsoft.com";

type FirebaseAuthSdk = typeof import("firebase/auth");

interface Firebase {
  auth: Auth;
  sdk: FirebaseAuthSdk;
}

let firebaseLoad: Promise<Firebase> | null = null;
const signInPreparations = new Set<() => Promise<void>>();

/** Registers session-provider preparation without loading Firebase on a cookie-only page. */
export const onBeforeFirebaseSignIn = (prepare: () => Promise<void>): (() => void) => {
  signInPreparations.add(prepare);
  return () => {
    signInPreparations.delete(prepare);
  };
};

/**
 * Loads the Firebase SDK and initializes it from the backend client config, once. Everything in
 * this module goes through here, and nothing on the signed-in page-load path calls it, so the
 * SDK is a dynamic import the consuming bundler can split into its own chunk and the browser only
 * fetches to sign in or out. A failed load is retried on the next call.
 */
const loadFirebase = (): Promise<Firebase> => {
  if (firebaseLoad === null) {
    firebaseLoad = (async () => {
      const [{ initializeApp }, sdk, clientConfig] = await Promise.all([
        import("firebase/app"),
        import("firebase/auth"),
        getAuthClientConfig(),
      ]);
      const app = initializeApp(clientConfig.firebase);
      return { auth: sdk.getAuth(app), sdk };
    })().catch((error: unknown) => {
      firebaseLoad = null;
      throw error;
    });
  }
  return firebaseLoad;
};

/** Every sign-in, including exported helpers, waits for the session provider's auth listener. */
const loadFirebaseForSignIn = async (): Promise<Firebase> => {
  await Promise.all([...signInPreparations].map((prepare) => prepare()));
  return loadFirebase();
};

// Errors propagate untouched: the calling page reports them, so nothing is logged twice here.

const signInWithProvider = async (
  createProvider: (sdk: FirebaseAuthSdk) => AuthProvider,
): Promise<User> => {
  const { auth, sdk } = await loadFirebaseForSignIn();
  const result = await sdk.signInWithPopup(auth, createProvider(sdk));
  return result.user;
};

export const signInWithGoogle = (): Promise<User> =>
  signInWithProvider((sdk) => new sdk.GoogleAuthProvider());

export const signInWithGitHub = (): Promise<User> =>
  signInWithProvider((sdk) => new sdk.GithubAuthProvider());

export const signInWithFacebook = (): Promise<User> =>
  signInWithProvider((sdk) => new sdk.FacebookAuthProvider());

export const signInWithMicrosoft = (): Promise<User> =>
  signInWithProvider((sdk) => new sdk.OAuthProvider(MICROSOFT_PROVIDER_ID));

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const { auth, sdk } = await loadFirebaseForSignIn();
  const result = await sdk.signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string,
): Promise<User> => {
  const { auth, sdk } = await loadFirebaseForSignIn();
  const result = await sdk.createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await sdk.updateProfile(result.user, { displayName });
  }
  await sdk.sendEmailVerification(result.user);
  return result.user;
};

export const resetPassword = async (email: string): Promise<void> => {
  const { auth, sdk } = await loadFirebase();
  await sdk.sendPasswordResetEmail(auth, email);
};

export const signOutUser = async (): Promise<void> => {
  const { auth, sdk } = await loadFirebase();
  await sdk.signOut(auth);
};

/**
 * Starts Firebase and reports its auth state, first the persisted state and then every change.
 * Returns an unsubscribe function that is safe to call before Firebase has finished loading.
 * [onError] receives a failure to load Firebase itself (for example an unreachable
 * `/auth/config`); without it such a failure is only logged.
 */
export const subscribeToAuthState = (
  callback: (user: User | null) => void,
  onError: (error: unknown) => void = (error) =>
    console.error("Unable to subscribe to Firebase auth state:", error),
): (() => void) => {
  let active = true;
  let unsubscribe: (() => void) | null = null;
  loadFirebase().then(
    ({ auth, sdk }) => {
      if (active) {
        unsubscribe = sdk.onAuthStateChanged(auth, callback);
      }
    },
    (error: unknown) => {
      if (active) onError(error);
    },
  );
  return () => {
    active = false;
    unsubscribe?.();
  };
};

export const sendAuthLinkToEmail = async (
  email: string,
  actionCodeSettings: ActionCodeSettings,
): Promise<void> => {
  const { auth, sdk } = await loadFirebase();
  await sdk.sendSignInLinkToEmail(auth, email, actionCodeSettings);
};

export const isAuthSignInWithEmailLink = async (emailLink: string): Promise<boolean> => {
  const { auth, sdk } = await loadFirebase();
  return sdk.isSignInWithEmailLink(auth, emailLink);
};

export const signInWithAuthEmailLink = async (email: string, emailLink: string): Promise<User> => {
  const { auth, sdk } = await loadFirebaseForSignIn();
  const result = await sdk.signInWithEmailLink(auth, email, emailLink);
  return result.user;
};

export const sendVerificationEmail = async (): Promise<void> => {
  const { auth, sdk } = await loadFirebase();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("No authenticated user to verify");
  }
  await sdk.sendEmailVerification(currentUser);
};

export const reloadCurrentUser = async (): Promise<User | null> => {
  const { auth, sdk } = await loadFirebase();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return null;
  }
  await sdk.reload(currentUser);
  return auth.currentUser;
};

export const signInAnonymousUser = async (): Promise<User> => {
  const { auth, sdk } = await loadFirebaseForSignIn();
  const result = await sdk.signInAnonymously(auth);
  return result.user;
};
