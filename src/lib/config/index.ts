import type { AuthClientConfig, AuthLibraryConfig, ResolvedAuthLibraryConfig } from "./types";

let config: ResolvedAuthLibraryConfig | null = null;
let clientConfigLoad: Promise<AuthClientConfig> | null = null;

/** Fixed same-origin auth routes registered by ktp-gcp-auth. Convention, not configuration. */
export const AUTH_URLS = {
  clientConfig: "/auth/config",
  login: "/auth/login",
  logout: "/auth/logout",
  /** `GET`: the signed-in user from the session cookie alone; 401 when there is none. */
  session: "/auth/session",
  /** `GET`, local dev only: signs in as a named dev user and redirects. See `devLoginUrl`. */
  devLogin: "/auth/dev/login",
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
    // Absent on servers predating the dev login; a missing flag can only hide a button.
    devLogin: root.devLogin === true,
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

/**
 * Resolves the frontend-only settings (routes, password rules). Synchronous and network-free, so
 * routes can be built before anything has been fetched; a repeat call is a no-op.
 */
export const initializeAuthLibrary = (userConfig: AuthLibraryConfig): void => {
  if (config !== null) {
    return;
  }
  config = {
    auth: {
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

/**
 * Backend-owned auth configuration (Firebase client keys, enabled providers, dev login), fetched
 * on first use and cached for the page's lifetime. A signed-in page load never needs it, which is
 * why it is not part of initialization. Concurrent callers share one request; a failed load is
 * retried on the next call.
 */
export const getAuthClientConfig = (): Promise<AuthClientConfig> => {
  if (clientConfigLoad === null) {
    clientConfigLoad = loadAuthClientConfig(AUTH_URLS.clientConfig).catch((error: unknown) => {
      clientConfigLoad = null;
      throw error;
    });
  }
  return clientConfigLoad;
};

export type {
  AuthClientConfig,
  AuthLibraryConfig,
  FirebaseClientConfig,
  ResolvedAuthLibraryConfig,
} from "./types";
