import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

const clientConfig = {
  firebase: {
    apiKey: "test-key",
    projectId: "test-project",
    authDomain: "test-project.firebaseapp.com",
  },
  enabledProviders: ["google.com", "password"],
  devLogin: true,
};

const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const userConfig = { auth: { routes: { afterLogin: "/dashboard" } } };

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("initializeAuthLibrary", () => {
  it("resolves frontend-only settings synchronously without touching the network", async () => {
    const { getAuthConfig, initializeAuthLibrary, isAuthLibraryInitialized } = await import(
      "./index"
    );

    expect(isAuthLibraryInitialized()).toBe(false);
    initializeAuthLibrary(userConfig);

    expect(isAuthLibraryInitialized()).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getAuthConfig()).toEqual({
      auth: {
        routes: {
          login: "/p/login",
          signup: "/p/signup",
          resetPassword: "/p/reset-password",
          signInWithEmail: "/p/login-email",
          signInWithPassword: "/p/login-password",
          verifyEmail: "/p/verify-email",
          anonymousLogin: "/p/anonymous-login",
          afterLogin: "/dashboard",
        },
        password: { minLength: 8 },
      },
    });
  });

  it("applies local UI route and password overrides", async () => {
    const { getAuthConfig, initializeAuthLibrary } = await import("./index");

    initializeAuthLibrary({
      auth: {
        routes: { login: "/login", afterLogin: "/home" },
        password: { minLength: 12 },
      },
    });

    expect(getAuthConfig().auth.routes.login).toBe("/login");
    expect(getAuthConfig().auth.routes.afterLogin).toBe("/home");
    expect(getAuthConfig().auth.password.minLength).toBe(12);
  });

  it("throws until initialized", async () => {
    const { getAuthConfig } = await import("./index");

    expect(getAuthConfig).toThrow("Auth library not initialized");
  });
});

describe("getAuthClientConfig", () => {
  it("loads backend-owned configuration from the fixed URL with default HTTP caching", async () => {
    fetchMock.mockResolvedValueOnce(response(clientConfig));
    const { getAuthClientConfig } = await import("./index");

    await expect(getAuthClientConfig()).resolves.toEqual(clientConfig);

    expect(fetchMock).toHaveBeenCalledWith(
      "/auth/config",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    // Default HTTP caching lets the browser honor the backend's max-age.
    expect(fetchMock.mock.calls[0]?.[1]).not.toHaveProperty("cache");
  });

  it("treats a missing devLogin flag as false", async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        firebase: clientConfig.firebase,
        enabledProviders: clientConfig.enabledProviders,
      }),
    );
    const { getAuthClientConfig } = await import("./index");

    await expect(getAuthClientConfig()).resolves.toMatchObject({ devLogin: false });
  });

  it("shares one request between concurrent callers and caches the result", async () => {
    fetchMock.mockResolvedValueOnce(response(clientConfig));
    const { getAuthClientConfig } = await import("./index");

    await Promise.all([getAuthClientConfig(), getAuthClientConfig()]);
    await getAuthClientConfig();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports backend errors and retries on the next call", async () => {
    fetchMock
      .mockResolvedValueOnce(response({}, 503))
      .mockResolvedValueOnce(response(clientConfig));
    const { getAuthClientConfig } = await import("./index");

    await expect(getAuthClientConfig()).rejects.toMatchObject({
      name: "AuthClientConfigError",
      status: 503,
    });
    await expect(getAuthClientConfig()).resolves.toEqual(clientConfig);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects invalid runtime configuration", async () => {
    fetchMock.mockResolvedValueOnce(
      response({ ...clientConfig, firebase: { ...clientConfig.firebase, authDomain: "" } }),
    );
    const { getAuthClientConfig } = await import("./index");

    await expect(getAuthClientConfig()).rejects.toThrow(
      "firebase.authDomain must be a non-blank string",
    );
  });
});
