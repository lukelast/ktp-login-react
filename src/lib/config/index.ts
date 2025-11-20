import { AuthLibraryConfig, ResolvedAuthLibraryConfig } from "./types";

let config: ResolvedAuthLibraryConfig | null = null;

export const initializeAuthLibrary = (userConfig: AuthLibraryConfig): void => {
  // Apply default authDomain if not provided
  const authDomain =
    userConfig.firebase.authDomain ||
    `${userConfig.firebase.projectId}.firebaseapp.com`;

  // Apply default endpoints if not provided
  const endpoints = {
    login: userConfig.auth.endpoints?.login || "/auth/login",
    logout: userConfig.auth.endpoints?.logout || "/auth/logout",
  };

  // Apply default routes if not provided
  const routes = {
    login: userConfig.auth.routes.login || "/p/login",
    signup: userConfig.auth.routes.signup || "/p/signup",
    resetPassword: userConfig.auth.routes.resetPassword || "/p/reset-password",
    signInWithEmail: userConfig.auth.routes.signInWithEmail || "/p/login-email",
    signInWithPassword: userConfig.auth.routes.signInWithPassword || "/p/login-password",
    afterLogin: userConfig.auth.routes.afterLogin,
    afterSignup: userConfig.auth.routes.afterSignup,
  };

  config = {
    ...userConfig,
    firebase: {
      ...userConfig.firebase,
      authDomain,
    },
    auth: {
      ...userConfig.auth,
      endpoints,
      routes,
    },
  };
};

export const getAuthConfig = (): ResolvedAuthLibraryConfig => {
  if (!config) {
    throw new Error(
      "Auth library not initialized. Call initializeAuthLibrary(config) before using auth components."
    );
  }
  return config;
};

export const isAuthLibraryInitialized = (): boolean => {
  return config !== null;
};

export type { AuthLibraryConfig, ResolvedAuthLibraryConfig } from "./types";
