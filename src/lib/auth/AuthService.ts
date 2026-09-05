import { AUTH_URLS } from "../config";
import type { User } from "./types";

/** Bounds each auth request so a hung network call fails fast instead of stalling the UI. */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * A backend auth request answered with an error status. Carries the status so callers can tell a
 * credential rejection (the backend refused this user) from a broken backend (a 500), which are
 * very different situations: the first means "signed out", the second means "unknown".
 */
export class AuthBackendError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Backend auth request failed with status ${status}`);
    this.name = "AuthBackendError";
    this.status = status;
  }

  /** True when the backend understood the request and refused the credentials. */
  get isAuthRejection(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

const readUser = async (response: Response, what: string): Promise<User> => {
  const data: { user?: User } = await response.json();
  if (!data.user) {
    throw new Error(`Backend ${what} returned no user data`);
  }
  return data.user;
};

export const AuthService = {
  /**
   * The signed-in user identified by the cookie, or null when there is no valid session. The
   * server periodically rechecks the account and roles; the browser SDK stays unloaded here.
   */
  session: async (): Promise<User | null> => {
    const response = await fetch(AUTH_URLS.session, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.status === 401) {
      return null;
    }
    if (!response.ok) {
      throw new AuthBackendError(response.status);
    }
    return readUser(response, "session");
  },

  /** Exchanges a Firebase ID token for the session cookie. */
  login: async (idToken: string): Promise<User> => {
    const response = await fetch(AUTH_URLS.login, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new AuthBackendError(response.status);
    }
    return readUser(response, "login");
  },

  logout: async (): Promise<void> => {
    const response = await fetch(AUTH_URLS.logout, {
      method: "POST",
      // Let the request finish even if the tab closes right after the click; the
      // session cookie must not outlive a sign-out the user believes happened.
      keepalive: true,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Logout failed with status ${response.status}`);
    }
  },
};
