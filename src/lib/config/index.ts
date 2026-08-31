import type { AuthClientConfig, AuthLibraryConfig, ResolvedAuthLibraryConfig } from "./types";

let config: ResolvedAuthLibraryConfig | null = null;
let initialization: Promise<void> | null = null;

/** Fixed same-origin auth routes registered by ktp-gcp-auth. Convention, not configuration. */
export const AUTH_URLS = {
  clientConfig: "/auth/config",
  login: "/auth/login",
  logout: "/auth/logout",
} as const;

const CLIENT_CONFIG_REQUEST_TIMEOUT_MS = 10_000;

const DEFAULTS = {
  auth: {
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

export class AuthClientConfigError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AuthClientConfigError";
  }
}

const asObject = (value: unknown, path: string): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AuthClientConfigError(`Invalid auth client configuration: ${path} must be an object`);
  }
  return value as Record<string, unknown>;
};

const asNonBlankString = (value: unknown, path: string): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AuthClientConfigError(
      `Invalid auth client configuration: ${path} must be a non-blank string`,
    );
  }
  return value;
};

const parseAuthClientConfig = (value: unknown): AuthClientConfig => {
  const root = asObject(value, "response");
  const firebase = asObject(root.firebase, "firebase");
  if (
    !Array.isArray(root.enabledProviders) ||
    root.enabledProviders.some((provider) => typeof provider !== "string" || provider.trim() === "")
  ) {
    throw new AuthClientConfigError(
      "Invalid auth client configuration: enabledProviders must contain only non-blank strings",
    );
  }

  return {
    firebase: {
      apiKey: asNonBlankString(firebase.apiKey, "firebase.apiKey"),
      projectId: asNonBlankString(firebase.projectId, "firebase.projectId"),
      authDomain: asNonBlankString(firebase.authDomain, "firebase.authDomain"),
    },
    enabledProviders: [...root.enabledProviders] as string[],
  };
};

const loadAuthClientConfig = async (url: string): Promise<AuthClientConfig> => {
  let response: Response;
  try {
    // Default HTTP caching: the backend serves successful responses with a max-age, so repeat
    // page loads within that window resolve from the browser cache without a network round trip.
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(CLIENT_CONFIG_REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    throw new AuthClientConfigError(
      `Unable to load auth client configuration from ${url}`,
      undefined,
      {
        cause,
      },
    );
  }

  if (!response.ok) {
    throw new AuthClientConfigError(
      `Unable to load auth client configuration from ${url}: HTTP ${response.status}`,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new AuthClientConfigError(
      `Auth client configuration from ${url} was not valid JSON`,
      undefined,
      { cause },
    );
  }
  return parseAuthClientConfig(body);
};

const initialize = async (userConfig: AuthLibraryConfig): Promise<void> => {
  const clientConfig = await loadAuthClientConfig(AUTH_URLS.clientConfig);

  config = {
    firebase: clientConfig.firebase,
    auth: {
      enabledProviders: clientConfig.enabledProviders,
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

/** Loads backend-owned auth configuration and resolves frontend-only settings. */
export const initializeAuthLibrary = (userConfig: AuthLibraryConfig): Promise<void> => {
  if (config !== null) {
    return Promise.resolve();
  }
  if (initialization === null) {
    initialization = initialize(userConfig).catch((error: unknown) => {
      initialization = null;
      throw error;
    });
  }
  return initialization;
};

export const getAuthConfig = (): ResolvedAuthLibraryConfig => {
  if (!config) {
    throw new Error(
      "Auth library not initialized. Await initializeAuthLibrary(config) before using auth components.",
    );
  }
  return config;
};

export const isAuthLibraryInitialized = (): boolean => {
  return config !== null;
};

export type {
  AuthClientConfig,
  AuthLibraryConfig,
  FirebaseClientConfig,
  ResolvedAuthLibraryConfig,
} from "./types";
