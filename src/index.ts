import "./styles.css";

// Configuration
export {
  AUTH_URLS,
  AuthClientConfigError,
  initializeAuthLibrary,
  getAuthConfig,
  getAuthClientConfig,
  isAuthLibraryInitialized,
} from "./lib/config";
export type {
  AuthClientConfig,
  AuthLibraryConfig,
  FirebaseClientConfig,
  ResolvedAuthLibraryConfig,
} from "./lib/config/types";

// Auth types
export type { User, AuthContextType } from "./lib/auth/types";
export { AuthBackendError } from "./lib/auth/AuthService";
export { devLoginUrl, DEV_USER_PATTERN } from "./lib/auth/devLogin";

// Auth hooks and components
export { useAuth } from "./lib/auth/useAuth";
export { AuthProvider } from "./lib/auth/AuthProvider";
export { ProtectedRoute } from "./lib/auth/ProtectedRoute";

// UI Components
export { LoginPage } from "./lib/components/LoginPage";
export { SignupPage } from "./lib/components/SignupPage";
export { PasswordResetPage } from "./lib/components/PasswordResetPage";
export { EmailSignInPage } from "./lib/components/EmailSignInPage";
export { PasswordSignInPage } from "./lib/components/PasswordSignInPage";
export { EmailVerificationPage } from "./lib/components/EmailVerificationPage";
export { AnonymousLoginPage } from "./lib/components/AnonymousLoginPage";

// Deploy recovery
export { installPreloadErrorReload } from "./lib/preloadError";

// Router
export { getAuthRoutes } from "./lib/routes";
export { AuthRoutes } from "./lib/components/AuthRoutes";

// Firebase utilities
export {
  signInWithGoogle,
  signInWithGitHub,
  signInWithMicrosoft,
  signInWithFacebook,
  signInWithEmail,
  signUpWithEmail,
  signInAnonymousUser,
  resetPassword,
  signOutUser,
  subscribeToAuthState,
  sendVerificationEmail,
  reloadCurrentUser,
  MICROSOFT_PROVIDER_ID,
} from "./lib/firebase/firebase";
