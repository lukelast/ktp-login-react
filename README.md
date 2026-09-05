# ktp-login-react

A comprehensive React authentication library powered by Firebase. Provides pre-built components and hooks for implementing login flows with multiple OAuth providers and email/password authentication. Ships as an ESM library with TypeScript declarations.

Designed to work with the [ktp-gcp-auth](https://github.com/lukelast/ktor-plus) backend library from the ktor-plus project.

## Features

- Firebase Authentication integration
- Multiple OAuth providers (Google, GitHub, Microsoft, Facebook)
- Email/password authentication with signup and password reset
- Pre-built, styled UI components
- Protected route component for securing pages
- Cookie-first sessions: a signed-in page load makes one request and never loads Firebase
- Local-dev login for browsers without your Firebase state (coding agents, second profiles)
- Fully typed with TypeScript

## Installation

```bash
npm install ktp-login-react
```

### Peer Dependencies

This library requires the following peer dependencies:

```bash
npm install react react-dom firebase react-router-dom
```

## Quick Start

### 1. Initialize the Library

Call `initializeAuthLibrary` before rendering. It is synchronous and network-free: it only resolves
frontend settings (routes, password rules). Firebase settings and enabled providers are fetched
lazily from the ktp-gcp-auth backend (`GET /auth/config`) by the pages that need them, so a
signed-in page load never waits on them.

```tsx
// src/main.tsx or src/index.tsx
import { initializeAuthLibrary } from "ktp-login-react";

initializeAuthLibrary({
  auth: {
    routes: {
      login: "/login",
      signup: "/signup",
      resetPassword: "/reset-password",
      afterLogin: "/dashboard",
    },
    password: {
      minLength: 8,
    },
  },
});
```

### 2. Wrap Your App with AuthProvider

```tsx
// src/App.tsx
import { AuthProvider } from "ktp-login-react";
import { BrowserRouter } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <YourRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### 3. Set Up Routes
 
 You can easily add all authentication pages to your app using the `AuthRoutes` component. This will automatically register routes based on your configuration.
 
 ```tsx
 import { Routes, Route } from "react-router-dom";
 import {
   AuthRoutes,
   ProtectedRoute,
   getAuthConfig,
 } from "ktp-login-react";
 
 function YourRoutes() {
   const { auth: { routes } } = getAuthConfig();
 
   return (
     <Routes>
       <Route path="/*" element={<AuthRoutes />} />
 
       {/* Protected routes */}
       <Route element={<ProtectedRoute />}>
         <Route path={routes.afterLogin} element={<Dashboard />} />
         <Route path="/profile" element={<Profile />} />
       </Route>
     </Routes>
   );
 }
 ```

### 4. Use the Auth Hook

```tsx
import { useAuth } from "ktp-login-react";

function Dashboard() {
  const { user, firebaseUser, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.nameFirst}!</h1>
      <p>Email: {user?.email}</p>
      <button onClick={logout}>Log Out</button>
    </div>
  );
}
```

## API Reference

### Configuration

```typescript
interface AuthLibraryConfig {
  auth: {
    routes: {
      login?: string; // Default: "/p/login"
      signup?: string; // Default: "/p/signup"
      resetPassword?: string; // Default: "/p/reset-password"
      signInWithEmail?: string; // Default: "/p/login-email"
      signInWithPassword?: string; // Default: "/p/login-password"
      verifyEmail?: string; // Default: "/p/verify-email"
      anonymousLogin?: string; // Default: "/p/anonymous-login"
      afterLogin: string; // Required redirect after successful login
    };
    password?: {
      minLength?: number; // Default: 8
    };
  };
}
```

### Provider IDs

The backend discovers enabled Firebase providers and returns their provider IDs. The library
currently recognizes:

- `"google.com"` - Google OAuth
- `"github.com"` - GitHub OAuth
- `"microsoft.com"` - Microsoft OAuth
- `"facebook.com"` - Facebook OAuth
- `"password"` - Email/password authentication
- `"emailLink"` - Passwordless email-link sign-in (Identity Platform's "Allow passwordless login"
  toggle); shows the "Send Email login link" button

### Exported Components

#### `AuthProvider`

Context provider that manages authentication state. Must wrap your app.

```tsx
<AuthProvider>{children}</AuthProvider>
```

#### `LoginPage`

Pre-built login page with OAuth buttons and email/password form.

```tsx
<LoginPage redirectTo="/custom-redirect" />
```

Props:

- `redirectTo?: string` - Override the default redirect after login

#### `SignupPage`

Pre-built signup page with email/password registration.

```tsx
<SignupPage />
```

#### `PasswordResetPage`

Pre-built password reset request page.

```tsx
<PasswordResetPage />
```

#### `ProtectedRoute`

Route guard that requires authentication. Renders `LoginPage` if not authenticated.

```tsx
// As a layout route
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>

// With children
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

### Hooks

#### `useAuth()`

Returns the authentication context.

```typescript
const { user, firebaseUser, isLoading, logout } = useAuth();
```

Returns:

- `user: User | null` - Backend user object
- `firebaseUser: FirebaseUser | null` - Firebase user object; null when the session was restored
  from the cookie (the normal page load), since Firebase is only loaded to establish a session
- `isLoading: boolean` - Auth state loading indicator
- `syncError: string | null` - Set when the backend could not be reached or failed; the state is
  then "unknown", not "signed out", and `ProtectedRoute` shows an error with a retry
- `isLoggingOut: boolean` - True while `logout` is in flight
- `logout: () => Promise<void>` - Ends the backend session, then signs out Firebase
- `refreshUser: () => Promise<FirebaseUser | null>` - Re-establishes the session

### Types

#### `User`

```typescript
interface User {
  userId: string;
  email: string;
  nameFull: string;
  nameFirst: string;
  roles: string[];
}
```

#### `getAuthClientConfig()`

`Promise<AuthClientConfig>`: the backend-owned settings (`firebase` client keys,
`enabledProviders`, `devLogin`), fetched on first use and cached for the page's lifetime. Rejects
with `AuthClientConfigError`; a failed load is retried on the next call.

### Firebase Utilities

Direct access to Firebase auth functions:

```typescript
import {
  signInWithGoogle,
  signInWithGitHub,
  signInWithMicrosoft,
  signInWithFacebook,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  signOutUser,
  subscribeToAuthState,
  MICROSOFT_PROVIDER_ID,
} from "ktp-login-react";
```

## Styling

Import the stylesheet once, anywhere in the app:

```ts
import "ktp-login-react/styles.css";
```

The screens are plain markup with stable `ktp-*` class names, and every color and shape in the
stylesheet comes from a `--ktp-*` custom property declared on `.ktp-page`. To skin them, redefine
the tokens; the app's own theme variables work as values, so the screens follow its color scheme:

```css
.ktp-page {
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

| Token                                                                | Default                       |
|----------------------------------------------------------------------|-------------------------------|
| `--ktp-bg`, `--ktp-surface`, `--ktp-hover`                           | page, card, and hover fills   |
| `--ktp-text`, `--ktp-text-muted`, `--ktp-border`                     | gray scale                    |
| `--ktp-accent`, `--ktp-accent-hover`, `--ktp-on-accent`              | blue primary, white text      |
| `--ktp-error-bg`, `--ktp-error-text`, `--ktp-success-bg`, `--ktp-success-text` | red and green notices |
| `--ktp-skeleton`, `--ktp-overlay`                                    | placeholder and overlay fills |
| `--ktp-font`                                                         | `inherit`                     |
| `--ktp-radius`, `--ktp-card-radius`, `--ktp-border-width`            | `0.375rem`, `0.5rem`, `1px`   |
| `--ktp-card-border`, `--ktp-card-shadow`, `--ktp-control-shadow`     | soft drop shadows             |
| `--ktp-focus-ring`                                                   | `2px solid var(--ktp-accent)` |
| `--ktp-title-weight`, `--ktp-label-weight`, `--ktp-control-weight`   | `700`, `500`, `500`           |

Everything ships inside the `ktp` cascade layer, so any unlayered rule in the app beats the
library's regardless of import order or specificity; for shapes the tokens cannot express, style
the classes directly (`.ktp-title`, `.ktp-btn-primary`, `.ktp-input`, ...). Form controls inherit
the page font and focus rings are outlines on `:focus-visible`, so a theme's own shadows and fonts
carry through untouched.

## Backend Integration

This library is designed to work with the [ktp-gcp-auth](https://github.com/lukelast/ktor-plus) library from the ktor-plus project, which provides the required backend endpoints for Ktor applications.

The paths are fixed and conventional (`AUTH_URLS`); ktp-gcp-auth registers the same ones, so
nothing is configurable on either side.

| Endpoint              | Used for                                                                        |
| --------------------- | ------------------------------------------------------------------------------- |
| `GET /auth/session`   | Page load: the signed-in user from the session cookie alone, or 401              |
| `GET /auth/config`    | Login page and Firebase init: client keys, enabled providers, `devLogin` flag    |
| `POST /auth/login`    | After a Firebase sign-in: exchanges the ID token for the session cookie          |
| `POST /auth/logout`   | Clears the session cookie                                                       |
| `GET /auth/dev/login` | Local dev only: signs in as a named dev user and redirects (see below)           |

### How a page load works

The session cookie is the source of truth. `AuthProvider` first asks `GET /auth/session`; when it
answers with a user, that is the session and Firebase is never loaded. Only on a 401 does the
Firebase SDK load (it is a dynamic import, so bundlers split it out): a persisted Firebase user is
exchanged for a new cookie via `POST /auth/login`, otherwise the login page shows. Sign-ins from
the login page go through Firebase and then `POST /auth/login` as before.

A `GET /auth/session` failure other than 401, or an unreachable `/auth/config`, is reported as
`syncError` rather than as "signed out", so `ProtectedRoute` shows a retry instead of the login
page.

### Local-dev login

When `/auth/config` reports `devLogin: true` (ktp-gcp-auth only does so on a local-dev
environment), the login page shows a "Local development" form that signs the browser in as a dev
user through a full navigation to `GET /auth/dev/login?user=<name>&redirect=<path>`. The server
creates a real user record and tenant for `dev-<name>` (or just `dev` when the name is left empty,
the default), sets the cookie, and redirects; the next page load restores the session like any
other. Each name owns its own data, which makes separate test fixtures trivial. `devLoginUrl(user, redirect)` builds the same URL for apps that
want their own control, and coding agents can simply navigate to it.

## Local Development

To run the demo app locally and test the UI components:

### 1. Start your backend server

Make sure your backend is running at `http://localhost:8080` with ktp-gcp-auth installed.

**Note:** The Vite dev server is configured to proxy all `/auth` requests to `http://localhost:8080`, so you won't encounter CORS issues during development.

### 2. Start the dev server

```bash
npm run dev
```

This opens the demo app at `http://localhost:5173` where you can:
- Test all authentication pages (Login, Signup, Password Reset)
- Try protected routes
- View the UI components in action

## Testing in Another Project

To test the library in another project before publishing:

### 1. Build and pack the library

```bash
npm run build
npm pack
# Creates ktp-login-react-0.0.0.tgz
```

### 2. Install in your project

```bash
npm install /path/to/ktp-login-react/ktp-login-react-0.0.0.tgz
```

### 3. Install peer dependencies

```bash
npm install react react-dom firebase react-router-dom
```

After making changes to the library, rebuild and repack, then reinstall in your project.
Note you should change the version number when doing this to avoid headaches.

## Scripts

| Command           | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| `npm run dev`     | Starts Vite in library mode for local development                  |
| `npm run lint`    | Runs ESLint over all `ts/tsx` sources                              |
| `npm run test`    | Executes the Vitest test suite                                     |
| `npm run build`   | Produces `dist/index.js` and type declarations  |
| `npm run preview` | Serves the most recent build with Vite's preview server            |


## Releasing

Create a github release with the version number as the tag.
The release will be built and deployed to the npm registry.
