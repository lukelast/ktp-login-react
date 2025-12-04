import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { initializeAuthLibrary, AuthProvider } from "../src";
import { App } from "./App";

// Initialize the auth library with configuration from environment variables
// See .env.example for required variables
initializeAuthLibrary({
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  },
  auth: {
    enabledProviders: ["google.com", "github.com", "microsoft.com", "facebook.com", "password"],
    routes: {
      afterLogin: "/dashboard",
    },
  },
});

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
