// @vitest-environment jsdom
import { act, cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import type { User as FirebaseUser } from "firebase/auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthClientConfigError } from "../config";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./useAuth";

vi.mock("../firebase/firebase", () => ({
  onBeforeFirebaseSignIn: vi.fn(() => vi.fn()),
  subscribeToAuthState: vi.fn(),
  signOutUser: vi.fn(async () => undefined),
  reloadCurrentUser: vi.fn(async () => null),
}));

const firebase = vi.mocked(await import("../firebase/firebase"));

const fetchMock = vi.fn();

const sessionUser = {
  userId: "user-1",
  email: "ada@example.test",
  nameFull: "Ada Lovelace",
  nameFirst: "Ada",
  roles: ["user"],
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Routes fetch by URL so each test declares only the endpoints it expects to be hit. */
const routeFetch = (routes: Record<string, () => Response | Promise<Response>>) => {
  fetchMock.mockImplementation((url: string) => {
    const route = routes[url];
    if (!route) throw new Error(`Unexpected fetch: ${url}`);
    return Promise.resolve(route());
  });
};

const verifiedFirebaseUser = () =>
  ({
    emailVerified: true,
    isAnonymous: false,
    getIdToken: vi.fn(async () => "id-token"),
  }) as unknown as FirebaseUser;

/** Captures the listener AuthProvider registers so tests can emit Firebase auth states. */
const captureFirebaseSubscription = () => {
  const captured: {
    emit: ((user: FirebaseUser | null) => void) | null;
    fail: ((error: unknown) => void) | null;
    unsubscribe: () => void;
  } = { emit: null, fail: null, unsubscribe: vi.fn(() => undefined) };
  firebase.subscribeToAuthState.mockImplementation((callback, onError) => {
    captured.emit = callback;
    captured.fail = onError ?? null;
    return captured.unsubscribe;
  });
  return captured;
};

const Probe = () => {
  const { user, isLoading, syncError, firebaseUser, logout, refreshUser } = useAuth();
  return (
    <div>
      <output data-testid="state">
        {JSON.stringify({
          user: user?.userId ?? null,
          isLoading,
          syncError,
          hasFirebaseUser: firebaseUser !== null,
        })}
      </output>
      <button type="button" onClick={() => void logout().catch(() => undefined)}>
        logout
      </button>
      <button type="button" onClick={() => void refreshUser().catch(() => undefined)}>
        refresh
      </button>
    </div>
  );
};

const state = () => JSON.parse(screen.getByTestId("state").textContent ?? "{}");

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

const fetchesTo = (url: string) => fetchMock.mock.calls.filter(([u]) => u === url);

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  fetchMock.mockReset();
  firebase.subscribeToAuthState.mockReset();
  firebase.signOutUser.mockReset().mockResolvedValue(undefined);
  firebase.reloadCurrentUser.mockClear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AuthProvider session establishment", () => {
  it("restores the session from the cookie alone and never starts Firebase", async () => {
    routeFetch({ "/auth/session": () => json({ user: sessionUser }) });

    renderProvider();

    await waitFor(() => expect(state().isLoading).toBe(false));
    expect(state()).toEqual({
      user: "user-1",
      isLoading: false,
      syncError: null,
      hasFirebaseUser: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(firebase.subscribeToAuthState).not.toHaveBeenCalled();
  });

  it("falls back to a persisted Firebase user and mints a session from it", async () => {
    routeFetch({
      "/auth/session": () => json({}, 401),
      "/auth/login": () => json({ user: sessionUser }),
    });
    const subscription = captureFirebaseSubscription();

    renderProvider();

    await waitFor(() => expect(subscription.emit).not.toBeNull());
    expect(state().isLoading).toBe(true);

    act(() => subscription.emit?.(verifiedFirebaseUser()));

    await waitFor(() => expect(state().isLoading).toBe(false));
    expect(state()).toMatchObject({ user: "user-1", syncError: null, hasFirebaseUser: true });
    expect(fetchesTo("/auth/login")).toHaveLength(1);
  });

  it("ends up signed out when neither the cookie nor Firebase has a user", async () => {
    routeFetch({ "/auth/session": () => json({}, 401) });
    const subscription = captureFirebaseSubscription();

    renderProvider();

    await waitFor(() => expect(subscription.emit).not.toBeNull());
    act(() => subscription.emit?.(null));

    await waitFor(() => expect(state().isLoading).toBe(false));
    expect(state()).toMatchObject({ user: null, syncError: null });
  });

  it("reports a broken backend instead of showing the user as signed out", async () => {
    routeFetch({ "/auth/session": () => json({}, 500) });

    renderProvider();

    await waitFor(() => expect(state().isLoading).toBe(false));
    expect(state()).toMatchObject({
      user: null,
      syncError: "The server failed to sign you in (HTTP 500).",
    });
    expect(firebase.subscribeToAuthState).not.toHaveBeenCalled();
  });

  it("reports a Firebase load failure as a sync error", async () => {
    routeFetch({ "/auth/session": () => json({}, 401) });
    const subscription = captureFirebaseSubscription();

    renderProvider();

    await waitFor(() => expect(subscription.fail).not.toBeNull());
    act(() => subscription.fail?.(new AuthClientConfigError("config down", 503)));

    await waitFor(() => expect(state().isLoading).toBe(false));
    expect(state().syncError).toBe("The server could not provide the sign-in configuration.");
  });

  it("retries a failed listener before an explicit sign-in", async () => {
    routeFetch({
      "/auth/session": () => json({}, 401),
      "/auth/login": () => json({ user: sessionUser }),
    });
    const subscription = captureFirebaseSubscription();
    renderProvider();
    await waitFor(() => expect(subscription.fail).not.toBeNull());
    act(() => subscription.fail?.(new AuthClientConfigError("config down", 503)));
    await waitFor(() => expect(state().syncError).not.toBeNull());

    const prepare = firebase.onBeforeFirebaseSignIn.mock.calls.at(-1)?.[0];
    let ready: Promise<void> | undefined;
    act(() => {
      ready = prepare?.();
    });
    expect(firebase.subscribeToAuthState).toHaveBeenCalledTimes(2);
    await act(async () => {
      subscription.emit?.(null);
      await ready;
    });
    act(() => subscription.emit?.(verifiedFirebaseUser()));

    await waitFor(() => expect(state().user).toBe("user-1"));
    expect(state().syncError).toBeNull();
  });

  it("recovers on refresh once the backend is back", async () => {
    let sessionStatus = 500;
    routeFetch({
      "/auth/session": () =>
        sessionStatus === 200 ? json({ user: sessionUser }) : json({}, sessionStatus),
    });

    renderProvider();
    await waitFor(() => expect(state().syncError).not.toBeNull());

    sessionStatus = 200;
    act(() => screen.getByText("refresh").click());

    await waitFor(() => expect(state().user).toBe("user-1"));
    expect(state().syncError).toBeNull();
    expect(firebase.subscribeToAuthState).not.toHaveBeenCalled();
  });

  it("unsubscribes from Firebase on unmount", async () => {
    routeFetch({ "/auth/session": () => json({}, 401) });
    const subscription = captureFirebaseSubscription();

    const { unmount } = renderProvider();
    await waitFor(() => expect(subscription.emit).not.toBeNull());

    unmount();

    expect(subscription.unsubscribe).toHaveBeenCalled();
  });
});

describe("AuthProvider logout", () => {
  it("waits for Firebase before ending the cookie session and coalesces concurrent calls", async () => {
    const firebaseLogout = Promise.withResolvers<void>();
    const backendLogout = Promise.withResolvers<Response>();
    firebase.signOutUser.mockImplementationOnce(() => firebaseLogout.promise);
    routeFetch({
      "/auth/session": () => json({ user: sessionUser }),
      "/auth/logout": () => backendLogout.promise,
    });
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.user).toEqual(sessionUser));

    let pendingLogout: Promise<void>;
    act(() => {
      pendingLogout = result.current.logout();
      expect(result.current.logout()).toBe(pendingLogout);
    });
    await waitFor(() => expect(firebase.signOutUser).toHaveBeenCalledTimes(1));
    expect(fetchesTo("/auth/logout")).toHaveLength(0);
    expect(result.current).toMatchObject({ user: sessionUser, isLoggingOut: true });

    await act(async () => firebaseLogout.resolve());

    expect(fetchesTo("/auth/logout")).toHaveLength(1);
    expect(result.current).toMatchObject({ user: sessionUser, isLoggingOut: true });
    await act(async () => {
      backendLogout.resolve(new Response(null, { status: 204 }));
      await pendingLogout;
    });

    expect(result.current).toMatchObject({
      user: null,
      firebaseUser: null,
      syncError: null,
      isLoggingOut: false,
    });
    expect(firebase.signOutUser).toHaveBeenCalledTimes(1);
    expect(firebase.subscribeToAuthState).not.toHaveBeenCalled();
  });

  it("preserves the cookie session and lets the caller retry when Firebase sign-out fails", async () => {
    const failure = new Error("Firebase could not load");
    firebase.signOutUser.mockRejectedValueOnce(failure);
    routeFetch({
      "/auth/session": () => json({ user: sessionUser }),
      "/auth/logout": () => new Response(null, { status: 204 }),
    });
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.user).toEqual(sessionUser));

    await act(async () => {
      await expect(result.current.logout()).rejects.toBe(failure);
    });

    expect(fetchesTo("/auth/logout")).toHaveLength(0);
    expect(result.current).toMatchObject({ user: sessionUser, isLoggingOut: false });
    await act(async () => result.current.logout());
    expect(result.current).toMatchObject({ user: null, isLoggingOut: false });
    expect(firebase.signOutUser).toHaveBeenCalledTimes(2);
    expect(fetchesTo("/auth/logout")).toHaveLength(1);
  });

  it("keeps the displayed user through Firebase's callback and a backend failure, then retries", async () => {
    const backendLogout = Promise.withResolvers<Response>();
    let logoutResponse = backendLogout.promise;
    routeFetch({
      "/auth/session": () => json({}, 401),
      "/auth/login": () => json({ user: sessionUser }),
      "/auth/logout": () => logoutResponse,
    });
    const subscription = captureFirebaseSubscription();
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(subscription.emit).not.toBeNull());
    const firebaseUser = verifiedFirebaseUser();
    act(() => subscription.emit?.(firebaseUser));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toEqual(sessionUser);
    const emitSignOut = async () => subscription.emit?.(null);
    firebase.signOutUser.mockImplementationOnce(emitSignOut).mockImplementationOnce(emitSignOut);

    let pendingLogout: Promise<void>;
    act(() => {
      pendingLogout = result.current.logout();
    });
    await waitFor(() => expect(fetchesTo("/auth/logout")).toHaveLength(1));
    expect(result.current).toMatchObject({
      user: sessionUser,
      firebaseUser,
      isLoading: false,
      isLoggingOut: true,
    });
    await act(async () => {
      backendLogout.resolve(json({}, 500));
      await expect(pendingLogout).rejects.toThrow("Logout failed with status 500");
    });

    expect(result.current).toMatchObject({ user: sessionUser, isLoggingOut: false });
    logoutResponse = Promise.resolve(new Response(null, { status: 204 }));
    await act(async () => result.current.logout());
    expect(result.current).toMatchObject({
      user: null,
      firebaseUser: null,
      isLoading: false,
      isLoggingOut: false,
    });
    expect(firebase.signOutUser).toHaveBeenCalledTimes(2);
    expect(fetchesTo("/auth/logout")).toHaveLength(2);
  });

  it("still applies Firebase sign-outs that occur outside an explicit logout", async () => {
    routeFetch({
      "/auth/session": () => json({}, 401),
      "/auth/login": () => json({ user: sessionUser }),
    });
    const subscription = captureFirebaseSubscription();
    renderProvider();
    await waitFor(() => expect(subscription.emit).not.toBeNull());
    act(() => subscription.emit?.(verifiedFirebaseUser()));
    await waitFor(() => expect(state().user).toBe("user-1"));

    act(() => subscription.emit?.(null));

    await waitFor(() => expect(state().isLoading).toBe(false));
    expect(state()).toMatchObject({ user: null, hasFirebaseUser: false });
  });
});
