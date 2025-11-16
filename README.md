# ktp-login-react

Small, typed React primitives that power the KTP login experience. The package ships as a dual-module library (ESM + CJS) with generated declaration files so consumers get great DX regardless of their bundler.

## Installation

```bash
npm install ktp-login-react
# or
yarn add ktp-login-react
```

```tsx
import { MyButton } from "ktp-login-react";

export const Example = () => (
  <MyButton variant="secondary">Continue</MyButton>
);
```

## Scripts

| Command              | Description                                                                 |
| -------------------- | --------------------------------------------------------------------------- |
| `npm run dev`        | Starts Vite in library mode so you can develop components locally.          |
| `npm run lint`       | Runs ESLint over all `ts/tsx` sources.                                      |
| `npm run test`       | Executes the Vitest test suite (placeholder until tests exist).             |
| `npm run build`      | Produces `dist/index.js`, `dist/index.cjs`, and `dist/types/**/*.d.ts`.      |
| `npm run preview`    | Serves the most recent build with Vite’s preview server.                    |

The `prepublishOnly` hook automatically runs `npm run build` so `npm publish` or `npm pack` always includes up-to-date artifacts.

## Project structure

- `src/lib` – source for the exported components. Add new components here and re-export them from `src/index.ts`.
- `tsconfig.build.json` – dedicated TypeScript config used to emit declaration files into `dist/types`.
- `vite.config.ts` – library build configuration that outputs both ESM and CJS bundles and marks React as a peer dependency/externals.

## Releasing

1. Update the version in `package.json`.
2. `npm run lint && npm run test` to ensure quality gates pass.
3. `npm publish` – this triggers a clean build and uploads the `dist` folder defined in the `files` whitelist.
