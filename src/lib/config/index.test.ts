import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

const clientConfig = {
  firebase: {
    apiKey: "test-key",
    projectId: "test-project",
    authDomain: "test-project.firebaseapp.com",
  },
  enabledProviders: ["google.com", "password"],
};

const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("initializeAuthLibrary", () => {
  it("loads backend-owned configuration from the default URL", async () => {
    fetchMock.mockResolvedValueOnce(response(clientConfig));
    const { getAuthConfig, initializeAuthLibrary } = await import("./index");

    await initializeAuthLibrary({
      auth: {
        routes: { afterLogin: "/dashboard" },
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/auth/config",
      expect.objectContaining({
        headers: { Accept: "application/json" },
      }),
    );
    // Default HTTP caching lets the browser honor the backend's max-age.
    expect(fetchMock.mock.calls[0]?.[1]).not.toHaveProperty("cache");
    expect(getAuthConfig()).toEqual({
      firebase: clientConfig.firebase,
      auth: {
        enabledProviders: clientConfig.enabledProviders,
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
    fetchMock.mockResolvedValueOnce(response(clientConfig));
    const { getAuthConfig, initializeAuthLibrary } = await import("./index");

    await initializeAuthLibrary({
      auth: {
        routes: {
          login: "/login",
          afterLogin: "/home",
        },
        password: { minLength: 12 },
      },
    });

    expect(getAuthConfig().auth.routes.login).toBe("/login");
    expect(getAuthConfig().auth.routes.afterLogin).toBe("/home");
    expect(getAuthConfig().auth.password.minLength).toBe(12);
  });

  it("coalesces concurrent initialization calls", async () => {
    fetchMock.mockResolvedValueOnce(response(clientConfig));
    const { initializeAuthLibrary } = await import("./index");
    const config = {
      auth: {
        routes: { afterLogin: "/dashboard" },
      },
    };

    await Promise.all([initializeAuthLibrary(config), initializeAuthLibrary(config)]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports backend errors and allows initialization to be retried", async () => {
    fetchMock
      .mockResolvedValueOnce(response({}, 503))
      .mockResolvedValueOnce(response(clientConfig));
    const { getAuthConfig, initializeAuthLibrary } = await import("./index");
    const config = {
      auth: {
        routes: { afterLogin: "/dashboard" },
      },
    };

    await expect(initializeAuthLibrary(config)).rejects.toMatchObject({
      name: "AuthClientConfigError",
      status: 503,
    });
    await expect(initializeAuthLibrary(config)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getAuthConfig().firebase).toEqual(clientConfig.firebase);
  });

  it("rejects invalid runtime configuration", async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        ...clientConfig,
        firebase: { ...clientConfig.firebase, authDomain: "" },
      }),
    );
    const { getAuthConfig, initializeAuthLibrary } = await import("./index");

    await expect(
      initializeAuthLibrary({ auth: { routes: { afterLogin: "/dashboard" } } }),
    ).rejects.toThrow("firebase.authDomain must be a non-blank string");
    expect(getAuthConfig).toThrow("Auth library not initialized");
  });
});
