import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { initializeAuthLibrary, AuthProvider } from "../src";
import { App } from "./App";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

// Synchronous: routes and password rules are frontend-only. Backend-owned config (Firebase keys,
// providers) is fetched lazily by the pages that need it.
initializeAuthLibrary({
  auth: {
    routes: {
      afterLogin: "/dashboard",
    },
  },
});

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
