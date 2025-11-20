import { FirebaseOptions } from "firebase/app";

export interface AuthLibraryConfig {
  firebase: Omit<FirebaseOptions, "authDomain"> & {
    authDomain?: string; // Defaults to ${projectId}.firebaseapp.com if not provided
  };

  auth: {
    enabledProviders: string[];

    endpoints?: {
      login?: string; // Defaults to /auth/login
      logout?: string; // Defaults to /auth/logout
    };

    routes: {
      login?: string; // Defaults to /p/login
      signup?: string; // Defaults to /p/signup
      resetPassword?: string; // Defaults to /p/reset-password
      signInWithEmail?: string; // Defaults to /p/email-signin
      signInWithPassword?: string; // Defaults to /p/login-password
      verifyEmail?: string; // Defaults to /p/verify-email
      afterLogin: string;
      afterSignup: string;
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
      afterSignup: string;
    };

    password?: {
      minLength?: number;
    };
  };
}
