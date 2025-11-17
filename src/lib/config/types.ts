import { FirebaseOptions } from "firebase/app";

export interface AuthLibraryConfig {
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
      afterLogin: string;
      afterSignup: string;
    };

    password?: {
      minLength?: number;
    };
  };
}
