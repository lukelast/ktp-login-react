import { initializeApp, FirebaseApp } from "firebase/app";
import {
  AuthProvider,
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
  Auth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  ActionCodeSettings,
} from "firebase/auth";
import { getAuthConfig } from "../config";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export const MICROSOFT_PROVIDER_ID = "microsoft.com";

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const microsoftProvider = new OAuthProvider(MICROSOFT_PROVIDER_ID);

const getFirebaseAuth = (): Auth => {
  if (!auth) {
    const config = getAuthConfig();
    app = initializeApp(config.firebase);
    auth = getAuth(app);
  }
  return auth;
};

const signInWithProvider = async (provider: AuthProvider): Promise<User> => {
  const firebaseAuth = getFirebaseAuth();
  try {
    const result = await signInWithPopup(firebaseAuth, provider);
    return result.user;
  } catch (error) {
    console.error(`Error signing in with ${provider.providerId}:`, error);
    throw error;
  }
};

export const signInWithGoogle = (): Promise<User> =>
  signInWithProvider(googleProvider);

export const signInWithGitHub = (): Promise<User> =>
  signInWithProvider(githubProvider);

export const signInWithFacebook = (): Promise<User> =>
  signInWithProvider(facebookProvider);

export const signInWithMicrosoft = (): Promise<User> =>
  signInWithProvider(microsoftProvider);

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  const firebaseAuth = getFirebaseAuth();
  try {
    const result = await signInWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );
    return result.user;
  } catch (error) {
    console.error("Error signing in with email:", error);
    throw error;
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  const firebaseAuth = getFirebaseAuth();
  try {
    const result = await createUserWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );
    return result.user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  const firebaseAuth = getFirebaseAuth();
  try {
    await sendPasswordResetEmail(firebaseAuth, email);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  const firebaseAuth = getFirebaseAuth();
  try {
    await signOut(firebaseAuth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const subscribeToAuthState = (
  callback: (user: User | null) => void
): (() => void) => {
  const firebaseAuth = getFirebaseAuth();
  return onAuthStateChanged(firebaseAuth, callback);
};

export const sendAuthLinkToEmail = async (
  email: string,
  actionCodeSettings: ActionCodeSettings
): Promise<void> => {
  const firebaseAuth = getFirebaseAuth();
  try {
    await sendSignInLinkToEmail(firebaseAuth, email, actionCodeSettings);
  } catch (error) {
    console.error("Error sending sign in link to email:", error);
    throw error;
  }
};

export const isAuthSignInWithEmailLink = (emailLink: string): boolean => {
  const firebaseAuth = getFirebaseAuth();
  return isSignInWithEmailLink(firebaseAuth, emailLink);
};

export const signInWithAuthEmailLink = async (
  email: string,
  emailLink: string
): Promise<User> => {
  const firebaseAuth = getFirebaseAuth();
  try {
    const result = await signInWithEmailLink(firebaseAuth, email, emailLink);
    return result.user;
  } catch (error) {
    console.error("Error signing in with email link:", error);
    throw error;
  }
};
