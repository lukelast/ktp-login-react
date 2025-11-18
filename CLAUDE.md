# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ktp-login-react** is a reusable React authentication library powered by Firebase. It provides pre-built components, hooks, and utilities for implementing login flows with OAuth providers (Google, GitHub, Microsoft, Facebook) and email/password authentication.

- **Type**: NPM library (ESM)
- **Status**: Early development (v0.0.0)

## Build Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server with demo app (localhost:5173) |
| `npm run build` | Build ESM and TypeScript declarations to dist/ |
| `npm run lint` | ESLint on src/**/*.{ts,tsx} |
| `npm run test` | Run Vitest test suite |
| `npm run preview` | Serve production build locally |

Run single test: `npx vitest run path/to/test.test.tsx`

## Architecture

```
src/
├── index.ts              # Public API re-exports
├── lib/
│   ├── config/           # initializeAuthLibrary() + getAuthConfig()
│   ├── auth/             # AuthProvider context, useAuth hook, ProtectedRoute
│   ├── firebase/         # Firebase SDK wrappers (sign-in functions)
│   └── components/       # LoginPage, SignupPage, PasswordResetPage (Tailwind)
demo/                     # Local testing app with routes
```

### Key Patterns

1. **Initialization**: Library must be initialized via `initializeAuthLibrary(config)` before any components render. Config is stored globally and accessed via `getAuthConfig()`.

2. **Auth Flow**: AuthProvider subscribes to Firebase auth state → obtains ID token → sends to backend `/auth/login` → stores returned user in context. Logout calls both Firebase and backend `/auth/logout`.

3. **Backend Required**: Library expects backend endpoints at `/auth/login` (receives `{ idToken }`, returns `{ user }`) and `/auth/logout`.

4. **Provider Gating**: OAuth buttons in LoginPage are conditionally rendered based on `config.auth.enabledProviders` array.

## Testing

- Framework: Vitest
- Location: Colocate tests with source (e.g., `src/lib/auth/useAuth.test.tsx`)
- Mock Firebase utilities when testing auth logic
- Use `--runInBand` for debugging flaky tests

## Local Development Setup

1. Copy `.env.example` to `.env.local` with Firebase credentials
2. Backend must run at `http://localhost:8080` (Vite proxies `/auth/*` automatically)
3. Demo flow: Home → Login/Signup/Reset → Dashboard (protected route)

## Code Style

- 2-space indentation, TypeScript throughout
- Named exports for tree-shaking
- Components/hooks: PascalCase; helpers: camelCase; constants: SCREAMING_SNAKE_CASE
- Inline Tailwind classes (no separate CSS files)

## Key Types

**Provider IDs**: `"google.com"`, `"github.com"`, `"microsoft.com"`, `"facebook.com"`, `"password"`

**User** (backend response):
```typescript
interface User {
  userId: string;
  nameFull: string;
  email: string;
  nameFirst: string;
  subscription?: string;
}
```

## Publishing

- `npm publish` triggers build via `prepublishOnly` hook
- Only `dist/` folder is published
- Peer deps: react 18/19, firebase 10/11, react-router-dom 6/7, tailwindcss 3/4
