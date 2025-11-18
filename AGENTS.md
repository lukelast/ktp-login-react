# Repository Guidelines

## Project Structure & Module Organization
All publishable code lives in `src`, with `src/index.ts` re-exporting modules from `src/lib`. `auth/` houses context logic, `firebase/` wraps SDK helpers, `config/` exposes initialization, and `components/` contains the React pages. Demo scenarios stay in `demo/`, while `dist/` is always generated.

## Build, Test, and Development Commands
- `npm run dev` starts Vite against the demo so UI changes can be verified interactively.
- `npm run build` compiles ESM, CJS, and type declarations into `dist/`.
- `npm run lint` runs ESLint across `src/**/*.{ts,tsx}` and should be clean before every PR.
- `npm run test` executes Vitest; add `--runInBand` to chase flaky suites.
- `npm run preview` serves the last build for a production-style sanity check.

## Coding Style & Naming Conventions
Stick to 2-space indentation, TypeScript syntax, and named exports so modules stay tree-shakeable. Components and hooks use PascalCase (`ProtectedRoute`, `useAuth`), while helpers are camelCase and constants are SCREAMING_SNAKE_CASE. Keep Tailwind classes inline, colocate feature-specific utilities, and only touch `dist/` via the build command.

## Testing Guidelines
Vitest is the required framework. Store specs beside the unit they cover (`src/lib/auth/useAuth.test.tsx`) and mock `../firebase/firebase` when network calls would occur. Each exported hook, provider, and page should have at least a smoke test plus regression cases linked to reported bugs or config edge cases.

## Commit & Pull Request Guidelines
Recent commits use short, imperative subjects such as `add auth code`; follow that style and keep one concern per commit. Pull requests must explain the why, summarize the notable files, list the commands run (`npm run lint && npm run test`), and attach UI screenshots when layouts change. Link tracking issues and tag reviewers who own the affected area (auth, firebase, components) to keep context flowing.

## Security & Configuration Tips
Secrets and tenant-specific endpoints never live in this repo. Pass them to `initializeAuthLibrary` from your host application, and guard new provider buttons the way `LoginPage.tsx` gates each OAuth option. Verify `/auth/login` and `/auth/logout` connectivity whenever changing fetch logic so library consumers avoid authentication outages.
