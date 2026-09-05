# ktp-login-react

> React authentication library powered by Firebase with pre-built login components and OAuth support

## Installation

```bash
npm install ktp-login-react
npm install react react-dom firebase react-router-dom
```

## Quick Setup

### 1. Initialize Library

Call `initializeAuthLibrary()` before rendering any components (typically in main.tsx). It is
synchronous: it only resolves frontend settings. Firebase settings and enabled providers are fetched
lazily from ktp-gcp-auth by the pages that need them.

```tsx
import { initializeAuthLibrary } from "ktp-login-react";

initializeAuthLibrary({
  auth: {
    routes: {
      afterLogin: "/dashboard",
    },
  },
});
```

### 2. Wrap App with AuthProvider

```tsx
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

### 3. Import Styles

Import the CSS in your main entry file:

```tsx
import "ktp-login-react/styles.css";
```

The screens are skinned by redefining the `--ktp-*` custom properties on `.ktp-page` (colors,
radii, borders, shadows, font); the stylesheet lives in the `ktp` cascade layer, so app rules
always win. See the README's Styling section for the token list.

### 4. Setup Routes

```tsx
import { Routes, Route } from "react-router-dom";
import { AuthRoutes, ProtectedRoute } from "ktp-login-react";

function YourRoutes() {
  return (
    <Routes>
      <Route path="/*" element={<AuthRoutes />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
```

## Core Exports

### Components

- `AuthProvider` - Context provider for auth state (wraps app)
- `LoginPage` - Pre-built login page with OAuth and email options
- `SignupPage` - Email/password signup page
- `PasswordResetPage` - Password reset request page
- `PasswordSignInPage` - Email/password sign-in page
- `EmailSignInPage` - Email link (passwordless) sign-in page
- `EmailVerificationPage` - Email verification page
- `AnonymousLoginPage` - Anonymous sign-in page for temporary accounts
- `ProtectedRoute` - Route guard requiring authentication
- `AuthRoutes` - Component that renders all auth pages based on config

### Hooks

- `useAuth()` - Returns auth context with user state

### Functions

- `initializeAuthLibrary(config)` - Set frontend config (routes, password rules); synchronous
- `getAuthConfig()` - Get current frontend config
- `isAuthLibraryInitialized()` - Check if initialized
- `getAuthClientConfig()` - Backend-owned config (Firebase keys, providers, `devLogin`), fetched
  lazily and cached; rejects with `AuthClientConfigError`, retried on the next call
- `getAuthRoutes()` - Get route configuration for auth pages
- `devLoginUrl(user, redirect)`, `DEV_USER_PATTERN` - Local-dev login URL and its user-name rule
- `AUTH_URLS` - The fixed backend paths

### Firebase Utilities

- `signInWithGoogle()` - Google OAuth sign-in
- `signInWithGitHub()` - GitHub OAuth sign-in
- `signInWithMicrosoft()` - Microsoft OAuth sign-in
- `signInWithFacebook()` - Facebook OAuth sign-in
- `signInWithEmail(email, password)` - Email/password sign-in
- `signUpWithEmail(email, password)` - Email/password signup
- `signInAnonymousUser()` - Anonymous sign-in (temporary account)
- `resetPassword(email)` - Send password reset email
- `signOutUser()` - Sign out current user
- `subscribeToAuthState(callback)` - Subscribe to auth state changes
- `sendVerificationEmail()` - Send email verification
- `reloadCurrentUser()` - Reload current Firebase user
- `MICROSOFT_PROVIDER_ID` - Microsoft provider ID constant

## Configuration

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
      afterLogin: string; // Required: where to redirect after login
    };
    password?: {
      minLength?: number; // Default: 8
    };
  };
}
```

### Configuration Defaults

The backend owns the Firebase config, enabled providers, and login/logout paths. The React client
only owns its UI routes and password validation setting.

**Required fields:**
- `auth.routes.afterLogin`

**Optional fields with defaults:**
- `auth.routes.login` → defaults to `/p/login`
- `auth.routes.signup` → defaults to `/p/signup`
- `auth.routes.resetPassword` → defaults to `/p/reset-password`
- `auth.routes.signInWithEmail` → defaults to `/p/login-email`
- `auth.routes.signInWithPassword` → defaults to `/p/login-password`
- `auth.routes.verifyEmail` → defaults to `/p/verify-email`
- `auth.routes.anonymousLogin` → defaults to `/p/anonymous-login`
- `auth.password.minLength` → defaults to `8`

### Provider IDs

ktp-gcp-auth discovers the configured providers from GCP. The React library recognizes these
provider IDs in the runtime response:
- `"google.com"` - Google OAuth
- `"github.com"` - GitHub OAuth
- `"microsoft.com"` - Microsoft OAuth
- `"facebook.com"` - Facebook OAuth
- `"password"` - Email/password authentication
- `"emailLink"` - Passwordless email-link sign-in (Identity Platform's "Allow passwordless login"
  toggle); shows the "Send Email login link" button

## useAuth Hook

```typescript
const { user, firebaseUser, syncError, isLoading, logout, refreshUser } = useAuth();
```

Returns:
- `user: User | null` - Backend user object
- `firebaseUser: FirebaseUser | null` - Firebase user object
- `syncError: string | null` - Presentable message when the backend session exchange failed for
  a non-auth reason (500, unreachable server, timeout). Null when signed out normally or after a
  credential rejection — those are just `user: null`. While set, `ProtectedRoute` shows an error
  screen with a retry button instead of the login page.
- `isLoading: boolean` - Loading state
- `logout: () => Promise<void>` - Logout function
- `refreshUser: () => Promise<FirebaseUser | null>` - Force refresh user state (also the retry
  path for `syncError`)

The `AuthBackendError` class (exported) is what a failed backend login or session request throws;
its `status` and `isAuthRejection` fields are how the provider tells a 401/403 from a broken
backend.

## User Type

```typescript
interface User {
  userId: string;
  email: string;
  nameFull: string;
  nameFirst: string;
  roles: string[];
}
```

## Backend Requirements

This library expects a ktp-gcp-auth backend with these endpoints at fixed paths (exported as
`AUTH_URLS`): `GET /auth/session`, `GET /auth/config`, `POST /auth/login`, `POST /auth/logout`,
and in local dev `GET /auth/dev/login`. The session is an HttpOnly cookie the backend sets on
login; the library never sees it.

### GET /auth/session

Called once on every page load by `AuthProvider`. Answers the same `user` object as `/auth/login`
from the cookie alone (re-issuing it to slide expiry), or 401 when there is no session. Nothing
else runs on the signed-in page-load path: Firebase is not loaded and `/auth/config` is not
fetched.

### GET /auth/config

Fetched lazily by the pages that need it (the login page, any Firebase call), never on a signed-in
page load. Its response has this shape:

```json
{
  "firebase": {
    "apiKey": "public-firebase-api-key",
    "projectId": "project-id",
    "authDomain": "project-id.firebaseapp.com"
  },
  "enabledProviders": ["google.com", "password"],
  "devLogin": false
}
```

Failed or invalid responses reject with `AuthClientConfigError`; the next `getAuthClientConfig()`
call retries.

### POST /auth/login

Called after Firebase authentication to sync session with backend.

Request:
```json
{
  "idToken": "firebase-jwt-token"
}
```

Response:
```json
{
  "user": {
    "userId": "123",
    "nameFull": "John Doe",
    "email": "john@example.com",
    "nameFirst": "John"
  }
}
```

### POST /auth/logout

Called when user logs out. No request body required; clears the cookie.

### GET /auth/dev/login

Local dev only (`devLogin: true` in `/auth/config`). A full navigation to
`/auth/dev/login?user=<name>&redirect=<path>` signs the browser in as `dev-<name>` (or `dev` when
`user` is omitted), sets the cookie, and redirects. The login page shows a form for it.

## Common Usage Patterns

### Reading Library Config for Links

**Important:** The library uses default routes (e.g., `/p/login`, `/p/signup`) that can be customized during initialization. Consumer applications should **read the library config** to create links rather than hardcoding paths. This ensures links match the configured routes.

Use `getAuthRoutes()` to get the configured auth routes:

```tsx
import { getAuthRoutes } from "ktp-login-react";
import { Link } from "react-router-dom";

function Header() {
  const routes = getAuthRoutes();

  return (
    <nav>
      <Link to={routes.login}>Login</Link>
      <Link to={routes.signup}>Sign Up</Link>
      <Link to={routes.resetPassword}>Reset Password</Link>
    </nav>
  );
}
```

Or use `getAuthConfig()` for full configuration access:

```tsx
import { getAuthConfig } from "ktp-login-react";

function Navigation() {
  const config = getAuthConfig();
  const { login, signup, resetPassword } = config.auth.routes;

  return (
    <nav>
      <a href={login}>Login</a>
      <a href={signup}>Sign Up</a>
      <a href={resetPassword}>Forgot Password?</a>
    </nav>
  );
}
```

**Why this matters:** If you hardcode `/login` but the library is configured with `/p/login`, your links will break. Always read from the config.

### Accessing User Info

```tsx
import { useAuth } from "ktp-login-react";

function Dashboard() {
  const { user, firebaseUser, isLoading, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <h1>Welcome {user.nameFirst}</h1>
      <p>Email: {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Custom Login Page

```tsx
import { LoginPage } from "ktp-login-react";

function CustomLoginRoute() {
  return <LoginPage redirectTo="/custom-destination" />;
}
```

### Protected Route Wrapper

```tsx
import { ProtectedRoute } from "ktp-login-react";

// As layout route (recommended)
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/profile" element={<Profile />} />
</Route>

// Or with children
<ProtectedRoute>
  <YourProtectedComponent />
</ProtectedRoute>
```

### Direct Firebase Auth

```tsx
import { signInWithGoogle, signUpWithEmail } from "ktp-login-react";

// OAuth sign-in
await signInWithGoogle();

// Email/password signup
await signUpWithEmail("user@example.com", "password123");
```

### Anonymous Login

Anonymous login allows users to access your app without creating an account. This is useful for trial experiences, guest access, or deferred registration. **Note:** Anonymous accounts are temporary and cannot be recovered once signed out.

**Using the pre-built page:**

The `AnonymousLoginPage` is automatically included in `AuthRoutes` at the configured route (default: `/p/anonymous-login`).

```tsx
import { getAuthRoutes } from "ktp-login-react";
import { Link } from "react-router-dom";

function LoginOptions() {
  const routes = getAuthRoutes();
  
  return (
    <div>
      <Link to={routes.login}>Sign In</Link>
      <Link to={routes.anonymousLogin}>Continue as Guest</Link>
    </div>
  );
}
```

**Using the component directly:**

```tsx
import { AnonymousLoginPage } from "ktp-login-react";

// In your routes
<Route path="/guest-login" element={<AnonymousLoginPage />} />
```

**Using the Firebase utility directly:**

```tsx
import { signInAnonymousUser } from "ktp-login-react";

async function handleGuestLogin() {
  try {
    const user = await signInAnonymousUser();
    console.log("Signed in anonymously:", user.uid);
  } catch (error) {
    console.error("Anonymous login failed:", error);
  }
}
```

**Detecting anonymous users:**

Anonymous users can be identified via the `firebaseUser.isAnonymous` property:

```tsx
import { useAuth } from "ktp-login-react";

function UserStatus() {
  const { user, firebaseUser } = useAuth();
  
  if (firebaseUser?.isAnonymous) {
    return <p>Logged in as Guest. <Link to="/signup">Create an account</Link></p>;
  }
  
  return <p>Welcome, {user?.nameFirst}!</p>;
}
```

## Important Notes

1. **Initialization Required**: Call `initializeAuthLibrary()` (synchronous) before rendering any components
2. **AuthProvider Required**: Must wrap app with `<AuthProvider>` for useAuth hook to work
3. **Backend Integration**: Requires the ktp-gcp-auth session, config, login, and logout endpoints
4. **React Router**: Uses react-router-dom for navigation
5. **CSS Import**: Must import "ktp-login-react/styles.css" for styled components
6. **Provider Gating**: Only providers listed in enabledProviders will show login buttons

## Auth Flow

1. On page load `AuthProvider` calls `/auth/session`; a 200 is the signed-in user, a 401 is signed
   out, anything else is `syncError` (state unknown, retry offered)
2. Signed out, the login page fetches `/auth/config` and shows the enabled providers (and the dev
   login form when `devLogin` is true)
3. User signs in with Firebase (OAuth or email/password); the SDK is loaded on demand
4. Library POSTs the Firebase ID token to `/auth/login`; the backend validates it, sets the session
   cookie, and returns the user object, which is stored in AuthContext
5. Later page loads restore the session from the cookie alone (step 1); Firebase is not involved
6. On logout, the library calls `/auth/logout` and then Firebase signOut

## TypeScript Support

Fully typed with TypeScript declarations included. All exports have proper type definitions.

## Compatible Backend

Designed to work with ktp-gcp-auth library from the ktor-plus project (Ktor backend).
Repository: https://github.com/lukelast/ktor-plus
