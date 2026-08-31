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

const main = async () => {
  await initializeAuthLibrary({
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
};

void main().catch((error: unknown) => {
  console.error("Unable to initialize authentication", error);
  root.render(<p>Unable to load authentication configuration.</p>);
});
