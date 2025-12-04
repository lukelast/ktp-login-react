import type { FirebaseOptions } from "firebase/app";

/**
 * See `DEFAULTS` in `./index.ts` for defaults.
 */
export interface AuthLibraryConfig {
  firebase: Omit<FirebaseOptions, "authDomain"> & {
    authDomain?: string;
  };

  auth: {
    enabledProviders: string[];

    endpoints?: {
      login?: string;
      logout?: string;
    };

    routes: {
      login?: string;
      signup?: string;
      resetPassword?: string;
      signInWithEmail?: string;
      signInWithPassword?: string;
      verifyEmail?: string;
      afterLogin: string;
    };

    password?: {
      minLength?: number;
    };
  };
}

// Internal resolved config with all defaults applied
export interface ResolvedAuthLibraryConfig {
  firebase: FirebaseOptions;

  auth: {
    enabledProviders: string[];

    endpoints: {
      login: string;
      logout: string;
    };

    routes: {
      login: string;
      signup: string;
      resetPassword: string;
      signInWithEmail: string;
      signInWithPassword: string;
      verifyEmail: string;
      afterLogin: string;
    };

    password: {
      minLength: number;
    };
  };
}
