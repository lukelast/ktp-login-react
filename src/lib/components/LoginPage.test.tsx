// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../auth/AuthContext";
import type { AuthContextType } from "../auth/types";
import { DEV_USER_PATTERN, devLoginUrl } from "../auth/devLogin";
import { AuthClientConfigError, initializeAuthLibrary } from "../config";
import { LoginPage } from "./LoginPage";

vi.mock("../auth/devLogin", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../auth/devLogin")>()),
  goToDevLogin: vi.fn(),
}));

// The real loader caches for the page's lifetime; each test needs its own answer.
vi.mock("../config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../config")>()),
  getAuthClientConfig: vi.fn(),
}));

const devLogin = vi.mocked(await import("../auth/devLogin"));
const config = vi.mocked(await import("../config"));

const clientConfig = (devLoginEnabled: boolean) => ({
  firebase: {
    apiKey: "test-key",
    projectId: "test-project",
    authDomain: "test-project.firebaseapp.com",
  },
  enabledProviders: ["google.com", "password"],
  devLogin: devLoginEnabled,
});

const signedOut: AuthContextType = {
  user: null,
  firebaseUser: null,
  isLoading: false,
  syncError: null,
  isLoggingOut: false,
  logout: async () => undefined,
  refreshUser: async () => null,
};

const renderLoginPage = (redirectTo?: string) =>
  render(
    <MemoryRouter>
      <AuthContext.Provider value={signedOut}>
        <LoginPage redirectTo={redirectTo} />
      </AuthContext.Provider>
    </MemoryRouter>,
  );

beforeEach(() => {
  initializeAuthLibrary({ auth: { routes: { afterLogin: "/p/home" } } });
});

afterEach(() => {
  cleanup();
  config.getAuthClientConfig.mockReset();
  devLogin.goToDevLogin.mockReset();
});

describe("LoginPage", () => {
  it("offers the providers the backend enables and no dev login by default", async () => {
    config.getAuthClientConfig.mockResolvedValue(clientConfig(false));

    renderLoginPage();

    expect(await screen.findByText("Continue with Google")).toBeTruthy();
    expect(screen.getByText("Sign in with Email & Password")).toBeTruthy();
    expect(screen.queryByText("Continue with GitHub")).toBeNull();
    expect(screen.queryByTestId("dev-login")).toBeNull();
  });

  it("offers the dev login when the server mounts it and sends the browser there", async () => {
    config.getAuthClientConfig.mockResolvedValue(clientConfig(true));

    renderLoginPage("/p/tracker?week=2");

    const input = await screen.findByLabelText(/Dev user/);
    fireEvent.change(input, { target: { value: "alice" } });
    fireEvent.submit(screen.getByTestId("dev-login"));

    expect(devLogin.goToDevLogin).toHaveBeenCalledWith("alice", "/p/tracker?week=2");
  });

  it("defaults to the unnamed dev user and the configured post-login route", async () => {
    config.getAuthClientConfig.mockResolvedValue(clientConfig(true));

    renderLoginPage();

    await screen.findByLabelText(/Dev user/);
    fireEvent.submit(screen.getByTestId("dev-login"));

    expect(devLogin.goToDevLogin).toHaveBeenCalledWith("", "/p/home");
  });

  it("shows a retryable error when the sign-in configuration cannot be loaded", async () => {
    config.getAuthClientConfig
      .mockRejectedValueOnce(new AuthClientConfigError("config down", 503))
      .mockResolvedValueOnce(clientConfig(false));

    renderLoginPage();

    expect(await screen.findByText("Sign-in unavailable")).toBeTruthy();
    expect(screen.getByText("config down")).toBeTruthy();
    fireEvent.click(screen.getByText("Try again"));

    await waitFor(() => expect(screen.getByText("Continue with Google")).toBeTruthy());
    expect(config.getAuthClientConfig).toHaveBeenCalledTimes(2);
  });
});

describe("DEV_USER_PATTERN", () => {
  it("compiles the way browsers compile the pattern attribute and matches server slugs", () => {
    const pattern = new RegExp(`^(?:${DEV_USER_PATTERN})$`, "v");

    expect(pattern.test("alice-b2")).toBe(true);
    expect(pattern.test("Alice")).toBe(false);
    expect(pattern.test("-alice")).toBe(false);
    expect(pattern.test("a".repeat(33))).toBe(false);
  });
});

describe("devLoginUrl", () => {
  it("encodes the user and the same-origin redirect", () => {
    expect(devLoginUrl("alice-b", "/p/tracker?week=2")).toBe(
      "/auth/dev/login?redirect=%2Fp%2Ftracker%3Fweek%3D2&user=alice-b",
    );
  });

  it("omits the user for the unnamed dev user", () => {
    expect(devLoginUrl("", "/")).toBe("/auth/dev/login?redirect=%2F");
  });
});
