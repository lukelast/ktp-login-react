import type { AuthLibraryConfig, ResolvedAuthLibraryConfig } from "./types";

let config: ResolvedAuthLibraryConfig | null = null;

const DEFAULTS = {
  auth: {
    endpoints: {
      login: "/auth/login",
      logout: "/auth/logout",
    },
    routes: {
      login: "/p/login",
      signup: "/p/signup",
      resetPassword: "/p/reset-password",
      signInWithEmail: "/p/login-email",
      signInWithPassword: "/p/login-password",
      verifyEmail: "/p/verify-email",
      anonymousLogin: "/p/anonymous-login",
    },
    password: {
      minLength: 8,
    },
  },
};

export const initializeAuthLibrary = (userConfig: AuthLibraryConfig): void => {
  const authDomain =
    userConfig.firebase.authDomain || `${userConfig.firebase.projectId}.firebaseapp.com`;

  config = {
    ...userConfig,
    firebase: {
      ...userConfig.firebase,
      authDomain,
    },
    auth: {
      ...userConfig.auth,
      endpoints: {
        ...DEFAULTS.auth.endpoints,
        ...userConfig.auth.endpoints,
      },
      routes: {
        ...DEFAULTS.auth.routes,
        ...userConfig.auth.routes,
      },
      password: {
        ...DEFAULTS.auth.password,
        ...userConfig.auth.password,
      },
    },
  };
};

export const getAuthConfig = (): ResolvedAuthLibraryConfig => {
  if (!config) {
    throw new Error(
      "Auth library not initialized. Call initializeAuthLibrary(config) before using auth components.",
    );
  }
  return config;
};

export const isAuthLibraryInitialized = (): boolean => {
  return config !== null;
};

export type { AuthLibraryConfig, ResolvedAuthLibraryConfig } from "./types";
