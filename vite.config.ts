import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Dev server configuration
  server: {
    open: true,
    proxy: {
      "/auth": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build:
    command === "build"
      ? {
          sourcemap: true,
          lib: {
            entry: path.resolve(__dirname, "src/index.ts"),
            name: "KtpLoginReact",
            formats: ["es"],
            fileName: () => "index.js",
          },
          rollupOptions: {
            // Don't bundle peer deps like react/react-dom
            external: [
              "react",
              "react-dom",
              "react/jsx-runtime",
              "react-router-dom",
              /^firebase(\/.*)?$/,
            ],
            output: {
              globals: {
                react: "React",
                "react-dom": "ReactDOM",
                "react/jsx-runtime": "jsxRuntime",
                "react-router-dom": "ReactRouterDOM",
              },
            },
          },
        }
      : {},
}));
