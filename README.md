# ktp-login-react

A comprehensive React authentication library powered by Firebase. Provides pre-built components and hooks for implementing login flows with multiple OAuth providers and email/password authentication. Ships as an ESM library with TypeScript declarations.

Designed to work with the [ktp-gcp-auth](https://github.com/lukelast/ktor-plus) backend library from the ktor-plus project.

## Features

- Firebase Authentication integration
- Multiple OAuth providers (Google, GitHub, Microsoft, Facebook)
- Email/password authentication with signup and password reset
- Pre-built, styled UI components (Tailwind CSS)
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

If using the pre-built UI components, you'll also need Tailwind CSS configured in your project.

## Quick Start

### 1. Initialize the Library

Before using any components, initialize the library with your configuration:

```tsx
// src/main.tsx or src/index.tsx
import { initializeAuthLibrary } from "ktp-login-react";

initializeAuthLibrary({
  firebase: {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
  },
  auth: {
    enabledProviders: [
      "google.com",
      "github.com",
      "microsoft.com",
      "facebook.com",
      "password", // Email/password auth
    ],
    endpoints: {
      login: "/api/auth/login",
      logout: "/api/auth/logout",
    },
    routes: {
      login: "/login",
      signup: "/signup",
      resetPassword: "/reset-password",
      afterLogin: "/dashboard",
      afterSignup: "/",
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

Use `getAuthConfig()` inside your component to access the route configuration and avoid duplicating path strings:

```tsx
// src/routes.tsx
import { Routes, Route } from "react-router-dom";
import {
  LoginPage,
  SignupPage,
  PasswordResetPage,
  ProtectedRoute,
  getAuthConfig,
} from "ktp-login-react";

function YourRoutes() {
  const { auth: { routes } } = getAuthConfig();

  return (
    <Routes>
      <Route path={routes.login} element={<LoginPage />} />
      <Route path={routes.signup} element={<SignupPage />} />
      <Route path={routes.resetPassword} element={<PasswordResetPage />} />

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
  firebase: FirebaseOptions; // Firebase configuration object

  auth: {
    enabledProviders: string[]; // Array of provider IDs to enable
    endpoints: {
      login: string; // Backend endpoint to sync Firebase auth
      logout: string; // Backend endpoint for logout
    };
    routes: {
      login: string; // Login page route
      signup: string; // Signup page route
      resetPassword: string; // Password reset page route
      afterLogin: string; // Redirect after successful login
      afterSignup: string; // Redirect after successful signup
    };
    password?: {
      minLength?: number; // Minimum password length (default: 6)
    };
  };
}
```

### Provider IDs

Use these strings in the `enabledProviders` array:

- `"google.com"` - Google OAuth
- `"github.com"` - GitHub OAuth
- `"microsoft.com"` - Microsoft OAuth
- `"facebook.com"` - Facebook OAuth
- `"password"` - Email/password authentication

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
  nameFull: string;
  email: string;
  nameFirst: string;
  subscription?: string;
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

The library expects your backend to have two endpoints:

### POST `/auth/login`

Called after Firebase authentication to sync with your backend.

Request:

```json
{
  "idToken": "firebase-id-token"
}
```

Response:

```json
{
  "user": {
    "userId": "123",
    "nameFull": "John Doe",
    "email": "john@example.com",
    "nameFirst": "John",
    "subscription": "pro"
  }
}
```

### POST `/auth/logout`

Called when user logs out.

## Customization

### Custom Login Flow

If you need more control, use the Firebase utilities directly:

```tsx
import { signInWithGoogle, useAuth } from "ktp-login-react";

function CustomLogin() {
  const { user } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      // AuthProvider automatically syncs with backend
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return <button onClick={handleGoogleLogin}>Custom Google Login</button>;
}
```

### Styling

The pre-built components use Tailwind CSS classes. To customize:

1. Override Tailwind classes in your config
2. Or create your own components using the hooks and utilities

## Local Development

To run the demo app locally and test the UI components:

### 1. Set up environment variables

Copy the example file and add your Firebase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY=your-actual-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id
```

The `.env.local` file is gitignored and won't be committed.

### 2. Start your backend server

Make sure your backend is running at `http://localhost:8080` with the `/auth/login` and `/auth/logout` endpoints.

**Note:** The Vite dev server is configured to proxy all `/auth` requests to `http://localhost:8080`, so you won't encounter CORS issues during development.

### 3. Start the dev server

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
npm install react react-dom firebase react-router-dom tailwindcss
```

After making changes to the library, rebuild and repack, then reinstall in your project.

**Note:** This approach is recommended over `npm link` on Windows, which can have symlink permission issues.

## Scripts

| Command           | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| `npm run dev`     | Starts Vite in library mode for local development                  |
| `npm run lint`    | Runs ESLint over all `ts/tsx` sources                              |
| `npm run test`    | Executes the Vitest test suite                                     |
| `npm run build`   | Produces `dist/index.js` and type declarations  |
| `npm run preview` | Serves the most recent build with Vite's preview server            |

## Project Structure

```
src/
├── index.ts                    # Main entry point
└── lib/
    ├── config/                 # Configuration system
    │   ├── index.ts            # initializeAuthLibrary()
    │   └── types.ts            # AuthLibraryConfig interface
    ├── auth/                   # Core auth functionality
    │   ├── types.ts            # User, AuthContextType
    │   ├── useAuth.ts          # useAuth hook
    │   ├── AuthProvider.tsx    # Context provider
    │   └── ProtectedRoute.tsx  # Route guard
    ├── firebase/               # Firebase integration
    │   └── firebase.ts         # Auth functions
    └── components/             # Pre-built UI
        ├── LoginPage.tsx
        ├── SignupPage.tsx
        └── PasswordResetPage.tsx
```

## Releasing

1. Update the version in `package.json`
2. Run `npm run lint && npm run test` to ensure quality gates pass
3. Run `npm publish` - this triggers a clean build and uploads the `dist` folder
