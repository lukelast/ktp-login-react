import { AuthLibraryConfig } from "./types";

let config: AuthLibraryConfig | null = null;

export const initializeAuthLibrary = (userConfig: AuthLibraryConfig): void => {
  config = userConfig;
};

export const getAuthConfig = (): AuthLibraryConfig => {
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

export type { AuthLibraryConfig } from "./types";
