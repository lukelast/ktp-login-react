# ktp-login-react

[![npm version](https://img.shields.io/npm/v/ktp-login-react)](https://www.npmjs.com/package/ktp-login-react)

React login screens and session handling for apps on the
[ktp-gcp-auth](https://github.com/lukelast/ktor-plus) backend: Firebase sign-in (Google, GitHub,
Microsoft, Facebook, email/password, email link, anonymous), a cookie-first session so a signed-in
page load makes one request and never loads Firebase, a `ProtectedRoute`, and a local-dev login for
browsers without your Firebase state. ESM with TypeScript declarations.

## Installation

```bash
npm install ktp-login-react react react-dom firebase react-router-dom
```

Requires React and React DOM 19.2.8+, Firebase 12.18.0+, and React Router DOM 7.18.3+
within their current major versions.

## Quick start

Configure once before rendering. This is synchronous and network-free: it only sets frontend
settings. Firebase keys and enabled providers come from the backend (`GET /auth/config`), fetched
lazily by the pages that need them.

```tsx
import { initializeAuthLibrary } from "ktp-login-react";
import "ktp-login-react/styles.css";

initializeAuthLibrary({ auth: { routes: { afterLogin: "/dashboard" } } });
```

Wrap the app in `AuthProvider` inside the router, mount the auth pages with `AuthRoutes`, and put
signed-in pages under `ProtectedRoute`:

```tsx
import { AuthProvider, AuthRoutes, ProtectedRoute, getAuthConfig, useAuth } from "ktp-login-react";

const { auth: { routes } } = getAuthConfig();

<BrowserRouter>
  <AuthProvider>
    <Routes>
      <Route path="/*" element={<AuthRoutes />} />
      <Route element={<ProtectedRoute />}>
        <Route path={routes.afterLogin} element={<Dashboard />} />
      </Route>
    </Routes>
  </AuthProvider>
</BrowserRouter>;

function Dashboard() {
  const { user, logout } = useAuth();
  return <button onClick={logout}>Log out {user?.nameFirst}</button>;
}
```

`ProtectedRoute` also takes children instead of acting as a layout route. `getAuthRoutes()` returns
the same pages as `RouteObject`s for data routers.

## Configuration

```typescript
interface AuthLibraryConfig {
  auth: {
    routes: {
      afterLogin: string; // where a successful login lands; required
      login?: string; // "/p/login"
      signup?: string; // "/p/signup"
      resetPassword?: string; // "/p/reset-password"
      signInWithEmail?: string; // "/p/login-email"
      signInWithPassword?: string; // "/p/login-password"
      verifyEmail?: string; // "/p/verify-email"
      anonymousLogin?: string; // "/p/anonymous-login"
    };
    password?: { minLength?: number }; // 8
  };
}
```

The login page shows a button per provider the backend reports enabled: `google.com`,
`github.com`, `microsoft.com`, `facebook.com`, `password`, and `emailLink` (Identity Platform's
"Allow passwordless login"). `LoginPage` accepts `redirectTo` to override `afterLogin`.

## `useAuth()`

- `user: User | null` - the backend's user: `userId`, `email`, `nameFull`, `nameFirst`, `roles`
- `firebaseUser: FirebaseUser | null` - null when the session was restored from the cookie, which
  is the normal page load; Firebase is only loaded to establish a session
- `isLoading: boolean`
- `syncError: string | null` - the backend could not be reached or failed, so the state is unknown
  rather than signed out; `ProtectedRoute` shows an error with a retry instead of the login page
- `isLoggingOut: boolean` - true while `logout` is in flight
- `logout: () => Promise<void>` - ends the Firebase and backend sessions; clears the displayed user
  only once both succeed and rejects otherwise, so the caller can show an error and retry
- `refreshUser: () => Promise<FirebaseUser | null>` - re-establishes the session

Also exported: `getAuthClientConfig()` (the backend-owned `firebase` keys, `enabledProviders`, and
`devLogin`, fetched on first use and cached; rejects with `AuthClientConfigError` and retries on the
next call), `AuthBackendError`, `AUTH_URLS`, `devLoginUrl`, and the Firebase helpers the pages use
(`signInWithGoogle`, `signInWithEmail`, `signOutUser`, `subscribeToAuthState`, ...).

## Styling

The screens are plain markup with stable `ktp-*` class names, and every color and shape in the
stylesheet comes from a `--ktp-*` custom property declared on `:root`. To skin them, redefine the
tokens there; the app's own theme variables work as values, so the screens follow its color scheme:

```css
:root {
  --ktp-bg: var(--mantine-color-body);
  --ktp-surface: var(--app-surface);
  --ktp-text: var(--mantine-color-text);
  --ktp-text-muted: var(--mantine-color-dimmed);
  --ktp-border: var(--app-ink);
  --ktp-accent: var(--app-accent);
  --ktp-accent-hover: var(--app-accent-hover);
  --ktp-card-border: 3px solid var(--app-ink);
  --ktp-card-shadow: 8px 8px 0 0 var(--app-ink);
}
```

| Token                                                                          | Default                       |
|--------------------------------------------------------------------------------|-------------------------------|
| `--ktp-bg`, `--ktp-surface`, `--ktp-hover`                                     | page, card, and hover fills   |
| `--ktp-text`, `--ktp-text-muted`, `--ktp-border`                               | gray scale                    |
| `--ktp-accent`, `--ktp-accent-hover`, `--ktp-on-accent`                        | blue primary, white text      |
| `--ktp-error-bg`, `--ktp-error-text`, `--ktp-success-bg`, `--ktp-success-text` | red and green notices         |
| `--ktp-skeleton`, `--ktp-overlay`                                              | placeholder and overlay fills |
| `--ktp-font`                                                                   | System sans-serif stack       |
| `--ktp-radius`, `--ktp-card-radius`, `--ktp-border-width`                      | `0.375rem`, `0.5rem`, `1px`   |
| `--ktp-card-border`, `--ktp-card-shadow`, `--ktp-control-shadow`               | soft drop shadows             |
| `--ktp-focus-ring`                                                             | `2px solid var(--ktp-accent)` |
| `--ktp-title-weight`, `--ktp-label-weight`, `--ktp-control-weight`             | `700`, `500`, `500`           |

Only the default tokens ship inside the `ktp` cascade layer, so unlayered app tokens win regardless
of import order. Component rules are unlayered so framework resets (including Tailwind Preflight)
cannot erase padding, borders, or typography. The default screens include a system font and scoped
box sizing; no app overrides are required. For shapes the tokens cannot express, import your
stylesheet after the library and style the classes directly
(`.ktp-title`, `.ktp-btn-primary`, `.ktp-input`, ...). Form controls inherit the page font and
focus rings are outlines on `:focus-visible`, so a theme's own shadows and fonts carry through.

## Backend

The paths are fixed (`AUTH_URLS`) and ktp-gcp-auth registers the same ones, so nothing is
configurable on either side.

| Endpoint              | Used for                                                                      |
|-----------------------|-------------------------------------------------------------------------------|
| `GET /auth/session`   | Page load: the signed-in user identified by the session cookie, or 401       |
| `GET /auth/config`    | Login page and Firebase init: client keys, enabled providers, `devLogin` flag |
| `POST /auth/login`    | After a Firebase sign-in: exchanges the ID token for the session cookie       |
| `POST /auth/logout`   | Clears the session cookie                                                     |
| `GET /auth/dev/login` | Local dev only: signs in as a dev user and redirects                          |

The cookie is the session. `AuthProvider` asks `GET /auth/session` first; a user means signed in
and Firebase is never loaded. Only on a 401 does the SDK load (a dynamic import, so bundlers split
it out): a persisted Firebase user is exchanged for a new cookie via `POST /auth/login`, otherwise
the login page shows. Any other failure of `/auth/session` or `/auth/config` is `syncError`, not
"signed out".

The backend periodically rechecks account eligibility and reloads roles on session restoration
and protected API requests. It updates the cookie on success, clears it on an access denial,
and returns a retryable 503 for service failures. These checks do not load Firebase in the browser.

**Local-dev login.** When `/auth/config` reports `devLogin: true` (ktp-gcp-auth only does so on a
local-dev environment), the login page shows a "Local development" form that navigates to
`GET /auth/dev/login?user=<name>&redirect=<path>`. The server creates a real user and tenant for
`dev-<name>` (`dev` when the name is left empty), sets the cookie, and redirects. Each name owns its
own data. `devLoginUrl(user, redirect)` builds the URL for apps and coding agents that want to
navigate there directly.

## Development

`npm run dev` serves the demo app on <http://localhost:5173>, proxying `/auth` to a ktp-gcp-auth
backend on `http://localhost:8080`. `npm run lint`, `npm test`, and `npm run build` are what CI
runs.

CI uses the latest Node 26 release and npm release, with GitHub Actions tracking their major-version tags. TypeScript remains on 6.0.3 because the latest
typescript-eslint (8.69.0) requires TypeScript below 6.1; upgrading to TypeScript 7
requires compatible lint tooling first.

To try a build in another project: `npm run build && npm pack`, then install the tarball there.
Reinstalling a tarball of the same version is cached by most package managers; bump the version or
clear the cache.

## Releasing

Create a GitHub release with the version number as the tag; the workflow builds and publishes it to
npm.
