import type { FirebaseOptions } from "firebase/app";

/** Public Firebase configuration returned by ktp-gcp-auth. */
export type FirebaseClientConfig = Required<
  Pick<FirebaseOptions, "apiKey" | "projectId" | "authDomain">
>;

/** Runtime response served by FirebaseAuthPlugin at GET /auth/config. */
export interface AuthClientConfig {
  firebase: FirebaseClientConfig;
  enabledProviders: string[];
  /** Whether the server mounts the local-dev login (`AUTH_URLS.devLogin`); local dev only. */
  devLogin: boolean;
}

/**
 * Frontend-only settings; nothing here comes from the backend. See `DEFAULTS` in `./index.ts`.
 */
export interface AuthLibraryConfig {
  auth: {
    routes: {
      login?: string;
      signup?: string;
      resetPassword?: string;
      signInWithEmail?: string;
      signInWithPassword?: string;
      verifyEmail?: string;
      afterLogin: string;
      anonymousLogin?: string;
    };

    password?: {
      minLength?: number;
    };
  };
}

// Internal resolved config with all defaults applied
export interface ResolvedAuthLibraryConfig {
  auth: {
    routes: {
      login: string;
      signup: string;
      resetPassword: string;
      signInWithEmail: string;
      signInWithPassword: string;
      verifyEmail: string;
      afterLogin: string;
      anonymousLogin: string;
    };

    password: {
      minLength: number;
    };
  };
}
