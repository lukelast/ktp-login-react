import { getAuthConfig } from "../config";
import type { User } from "./types";

/** Bounds each auth request so a hung network call fails fast instead of stalling the UI. */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * A `/auth/login` exchange the backend answered with an error status. Carries the status so
 * callers can tell a credential rejection (the backend refused this user) from a broken backend
 * (a 500), which are very different situations: the first means "signed out", the second means
 * "unknown".
 */
export class AuthBackendError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Backend login failed with status ${status}`);
    this.name = "AuthBackendError";
    this.status = status;
  }

  /** True when the backend understood the request and refused the credentials. */
  get isAuthRejection(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

export const AuthService = {
  login: async (idToken: string): Promise<User> => {
    const config = getAuthConfig();
    const response = await fetch(config.auth.endpoints.login, {
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
    const data: { user?: User } = await response.json();
    if (!data.user) {
      throw new Error("Backend login returned no user data");
    }
    return data.user;
  },

  logout: async (): Promise<void> => {
    const config = getAuthConfig();
    const response = await fetch(config.auth.endpoints.logout, {
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
