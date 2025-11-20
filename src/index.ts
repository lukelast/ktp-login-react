import "./styles.css";

// Configuration
export {
  initializeAuthLibrary,
  getAuthConfig,
  isAuthLibraryInitialized,
} from "./lib/config";
export type { AuthLibraryConfig } from "./lib/config/types";

// Auth types
export type { User, AuthContextType } from "./lib/auth/types";

// Auth hooks and components
export { useAuth } from "./lib/auth/useAuth";
export { AuthProvider } from "./lib/auth/AuthProvider";
export { ProtectedRoute } from "./lib/auth/ProtectedRoute";

// UI Components
export { LoginPage } from "./lib/components/LoginPage";
export { SignupPage } from "./lib/components/SignupPage";
export { PasswordResetPage } from "./lib/components/PasswordResetPage";
export { PasswordSignInPage } from "./lib/components/PasswordSignInPage";

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
  resetPassword,
  signOutUser,
  subscribeToAuthState,
  MICROSOFT_PROVIDER_ID,
} from "./lib/firebase/firebase";
