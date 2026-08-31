# ktp-login-react

A comprehensive React authentication library powered by Firebase. Provides pre-built components and hooks for implementing login flows with multiple OAuth providers and email/password authentication. Ships as an ESM library with TypeScript declarations.

Designed to work with the [ktp-gcp-auth](https://github.com/lukelast/ktor-plus) backend library from the ktor-plus project.

## Features

- Firebase Authentication integration
- Multiple OAuth providers (Google, GitHub, Microsoft, Facebook)
- Email/password authentication with signup and password reset
- Pre-built, styled UI components
- Protected route component for securing pages
- Backend session synchronization
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

Before rendering any components, await initialization. Firebase settings and enabled providers are
loaded from the ktp-gcp-auth backend at `GET /auth/config`:

```tsx
// src/main.tsx or src/index.tsx
import { initializeAuthLibrary } from "ktp-login-react";

await initializeAuthLibrary({
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
- `firebaseUser: FirebaseUser | null` - Firebase user object
- `isLoading: boolean` - Auth state loading indicator
- `logout: () => Promise<void>` - Logout function

### Types

#### `User`

```typescript
interface User {
  userId: string;
  email: string;
  nameFull: string;
  nameFirst: string;
  roles: string[];
  extra: unknown;
}
```

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

## Backend Integration

This library is designed to work with the [ktp-gcp-auth](https://github.com/lukelast/ktor-plus) library from the ktor-plus project, which provides the required backend endpoints for Ktor applications.

The library uses three backend endpoints with fixed, conventional paths (`AUTH_URLS`):
`GET /auth/config`, `POST /auth/login`, and `POST /auth/logout`. ktp-gcp-auth registers the same
paths, so nothing is configurable on either side.

### GET `/auth/config`

Loaded once by `initializeAuthLibrary()`. It supplies the public Firebase client settings and
enabled providers. A non-successful or invalid response rejects initialization with
`AuthClientConfigError`; the application should show an appropriate startup error rather than
rendering auth components.

### POST `/auth/login`

Called after Firebase authentication to sync with your backend.

### POST `/auth/logout`

Called when user logs out.

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
