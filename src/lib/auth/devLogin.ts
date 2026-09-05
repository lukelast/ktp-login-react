import { AUTH_URLS } from "../config";

/**
 * Same-origin URL that signs the browser in as a local-dev user and lands on `redirect`: the user
 * `dev-<user>`, or the unnamed `dev` when `user` is empty. Only works where
 * `AuthClientConfig.devLogin` is true; anywhere else the route does not exist.
 */
export const devLoginUrl = (user: string, redirect: string): string => {
  const params = new URLSearchParams({ redirect });
  if (user) params.set("user", user);
  return `${AUTH_URLS.devLogin}?${params.toString()}`;
};

/**
 * A full navigation, not a fetch: the server answers with the session cookie and a redirect, and
 * the next page load restores the session from that cookie like any other.
 */
export const goToDevLogin = (user: string, redirect: string): void => {
  window.location.assign(devLoginUrl(user, redirect));
};

/**
 * What the server accepts as a dev user name; mirrored here so the form can validate inline.
 * Browsers compile the `pattern` attribute with the `v` flag, which rejects an unescaped `-`
 * inside a character class, hence the escape.
 */
export const DEV_USER_PATTERN = String.raw`[a-z0-9][a-z0-9\-]{0,31}`;
