import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

const clientConfig = {
  firebase: {
    apiKey: "test-key",
    projectId: "test-project",
    authDomain: "test-project.firebaseapp.com",
  },
  enabledProviders: ["google.com"],
  devLogin: false,
};

const configResponse = (status = 200) =>
  new Response(JSON.stringify(status === 200 ? clientConfig : {}), { status });

const authInstance = { currentUser: null };
const firebaseUser = { uid: "fb-1" };

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({ name: "[DEFAULT]" })),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => authInstance),
  onAuthStateChanged: vi.fn(() => vi.fn()),
  signInWithPopup: vi.fn(async () => ({ user: firebaseUser })),
  signOut: vi.fn(async () => undefined),
  GoogleAuthProvider: class GoogleAuthProvider {},
}));

const sdk = async () => {
  const app = vi.mocked(await import("firebase/app"));
  const auth = vi.mocked(await import("firebase/auth"));
  return { app, auth };
};

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  // The vi.mock'd SDK modules survive resetModules; drop their call history between tests.
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("lazy Firebase loading", () => {
  it("does nothing on import: no config fetch, no SDK initialization", async () => {
    await import("./firebase");
    const { app } = await sdk();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(app.initializeApp).not.toHaveBeenCalled();
  });

  it("initializes once from the backend client config on first use", async () => {
    fetchMock.mockResolvedValueOnce(configResponse());
    const { signInWithGoogle, signOutUser } = await import("./firebase");
    const { app, auth } = await sdk();

    await expect(signInWithGoogle()).resolves.toBe(firebaseUser);
    await signOutUser();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/auth/config", expect.anything());
    expect(app.initializeApp).toHaveBeenCalledTimes(1);
    expect(app.initializeApp).toHaveBeenCalledWith(clientConfig.firebase);
    expect(auth.getAuth).toHaveBeenCalledTimes(1);
    expect(auth.signInWithPopup).toHaveBeenCalledWith(authInstance, expect.anything());
    expect(auth.signOut).toHaveBeenCalledWith(authInstance);
  });

  it("subscribes to auth state after loading and unsubscribes on request", async () => {
    fetchMock.mockResolvedValueOnce(configResponse());
    const { subscribeToAuthState } = await import("./firebase");
    const { auth } = await sdk();
    const unsubscribeFromSdk = vi.fn();
    auth.onAuthStateChanged.mockReturnValueOnce(unsubscribeFromSdk);
    const callback = vi.fn();

    const unsubscribe = subscribeToAuthState(callback);
    await vi.waitFor(() => expect(auth.onAuthStateChanged).toHaveBeenCalledTimes(1));
    expect(auth.onAuthStateChanged).toHaveBeenCalledWith(authInstance, callback);

    unsubscribe();

    expect(unsubscribeFromSdk).toHaveBeenCalledTimes(1);
  });

  it("never subscribes when unsubscribed before Firebase finished loading", async () => {
    fetchMock.mockResolvedValueOnce(configResponse());
    const { subscribeToAuthState } = await import("./firebase");
    const { auth } = await sdk();

    subscribeToAuthState(vi.fn())();
    // Let the pending load settle.
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(auth.onAuthStateChanged).not.toHaveBeenCalled();
  });

  it("reports a failed load to the subscriber and retries it next time", async () => {
    fetchMock.mockResolvedValueOnce(configResponse(503)).mockResolvedValueOnce(configResponse());
    const { signInWithGoogle, subscribeToAuthState } = await import("./firebase");
    const { app } = await sdk();
    const onError = vi.fn();

    subscribeToAuthState(vi.fn(), onError);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError.mock.calls[0]?.[0]).toMatchObject({ name: "AuthClientConfigError" });
    expect(app.initializeApp).not.toHaveBeenCalled();

    await expect(signInWithGoogle()).resolves.toBe(firebaseUser);
    expect(app.initializeApp).toHaveBeenCalledTimes(1);
  });
});
