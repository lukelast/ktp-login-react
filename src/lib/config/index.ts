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

  config = {
    ...userConfig,
    firebase: {
      ...userConfig.firebase,
      authDomain,
    },
    auth: {
      ...userConfig.auth,
      endpoints,
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
