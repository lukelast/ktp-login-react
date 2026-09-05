// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from "@testing-library/react";
import type { User as FirebaseUser } from "firebase/auth";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as firebase from "../firebase/firebase";
import type { AuthContextType } from "./types";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./useAuth";

const sdkState = vi.hoisted(() => ({
  auth: { currentUser: null as FirebaseUser | null },
  nextUser: null as FirebaseUser | null,
  reportInitialState: true,
  listeners: new Set<(user: FirebaseUser | null) => void>(),
}));

vi.mock("firebase/app", () => ({ initializeApp: vi.fn(() => ({})) }));

vi.mock("firebase/auth", () => {
  const signIn = async () => {
    sdkState.auth.currentUser = sdkState.nextUser;
    for (const listener of sdkState.listeners) listener(sdkState.nextUser);
    return { user: sdkState.nextUser };
  };
  class Provider {}
  return {
    getAuth: vi.fn(() => sdkState.auth),
    onAuthStateChanged: vi.fn((_: unknown, callback: (user: FirebaseUser | null) => void) => {
      sdkState.listeners.add(callback);
      queueMicrotask(() => {
        if (sdkState.reportInitialState && sdkState.listeners.has(callback))
          callback(sdkState.auth.currentUser);
      });
      return () => sdkState.listeners.delete(callback);
    }),
    signInWithPopup: vi.fn(signIn),
    signInWithEmailAndPassword: vi.fn(signIn),
    signInWithEmailLink: vi.fn(signIn),
    signInAnonymously: vi.fn(signIn),
    createUserWithEmailAndPassword: vi.fn(signIn),
    updateProfile: vi.fn(async () => undefined),
    sendEmailVerification: vi.fn(async () => undefined),
    signOut: vi.fn(async () => {
      sdkState.auth.currentUser = null;
      for (const listener of sdkState.listeners) listener(null);
    }),
    GoogleAuthProvider: Provider,
    GithubAuthProvider: Provider,
    FacebookAuthProvider: Provider,
    OAuthProvider: Provider,
  };
});

const fetchMock = vi.fn();
let context: AuthContextType;
let hasCookie: boolean;
const restoredUser = {
  userId: "restored-user",
  email: "old@example.test",
  nameFull: "Old User",
  nameFirst: "Old",
  roles: [],
};
const signedInUser = { ...restoredUser, userId: "new-user", email: "new@example.test" };

const Probe = () => {
  const value = useAuth();
  useEffect(() => {
    context = value;
  }, [value]);
  return null;
};

const mount = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

beforeEach(() => {
  hasCookie = true;
  sdkState.reportInitialState = true;
  sdkState.auth.currentUser = null;
  sdkState.nextUser = {
    uid: "new-user",
    emailVerified: true,
    isAnonymous: false,
    getIdToken: vi.fn(async () => "new-token"),
  } as unknown as FirebaseUser;
  fetchMock.mockImplementation(async (url: string) => {
    switch (url) {
      case "/auth/session":
        return Response.json(hasCookie ? { user: restoredUser } : {}, {
          status: hasCookie ? 200 : 401,
        });
      case "/auth/config":
        return Response.json({
          firebase: { apiKey: "test", projectId: "test", authDomain: "test.firebaseapp.com" },
          enabledProviders: ["google.com", "password"],
        });
      case "/auth/logout":
        hasCookie = false;
        return new Response(null, { status: 204 });
      case "/auth/login":
        hasCookie = true;
        return Response.json({ user: signedInUser });
      default:
        throw new Error(`Unexpected fetch: ${url}`);
    }
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  expect(sdkState.listeners.size).toBe(0);
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const signIns = [
  ["Google", firebase.signInWithGoogle],
  ["GitHub", firebase.signInWithGitHub],
  ["Facebook", firebase.signInWithFacebook],
  ["Microsoft", firebase.signInWithMicrosoft],
  ["password", () => firebase.signInWithEmail("new@example.test", "password")],
  ["email link", () => firebase.signInWithAuthEmailLink("new@example.test", "https://test/link")],
  ["anonymous", firebase.signInAnonymousUser],
] as const;

describe("Firebase sign-in after cookie restoration", () => {
  it.each(signIns)("exchanges a %s sign-in after logout without remounting", async (_, signIn) => {
    mount();
    await waitFor(() => expect(context.user).toEqual(restoredUser));
    // Restoring the cookie neither fetches Firebase config nor subscribes to the SDK.
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["/auth/session"]);
    expect(sdkState.listeners.size).toBe(0);

    await act(async () => context.logout());
    expect(context.user).toBeNull();
    expect(sdkState.listeners.size).toBe(0);

    await act(async () => {
      await signIn();
    });

    await waitFor(() => expect(context.user).toEqual(signedInUser));
    expect(context.firebaseUser).toBe(sdkState.nextUser);
    expect(fetchMock.mock.calls.filter(([url]) => url === "/auth/login")).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({
        body: JSON.stringify({ idToken: "new-token" }),
      }),
    );
    expect(sdkState.listeners.size).toBe(1);
  });

  it("observes an explicit sign-in even without a preceding logout", async () => {
    mount();
    await waitFor(() => expect(context.user).toEqual(restoredUser));

    await act(async () => {
      await firebase.signInWithGoogle();
    });

    await waitFor(() => expect(context.user).toEqual(signedInUser));
  });

  it("ignores an older cookie response arriving after an explicit sign-in", async () => {
    let restoreCookie!: (response: Response) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          restoreCookie = resolve;
        }),
    );
    mount();
    await act(async () => {
      await firebase.signInWithGoogle();
    });
    await waitFor(() => expect(context.user).toEqual(signedInUser));

    await act(async () => {
      restoreCookie(Response.json({ user: restoredUser }));
    });

    expect(context.user).toEqual(signedInUser);
  });

  it("reuses the listener when Firebase already established the signed-out state", async () => {
    hasCookie = false;
    mount();
    await waitFor(() => expect(context.isLoading).toBe(false));
    expect(sdkState.listeners.size).toBe(1);

    await act(async () => {
      await firebase.signInWithGoogle();
    });

    await waitFor(() => expect(context.user).toEqual(signedInUser));
    expect(sdkState.listeners.size).toBe(1);
    expect(fetchMock.mock.calls.filter(([url]) => url === "/auth/login")).toHaveLength(1);
  });

  it("observes an unverified signup after cookie-restored logout", async () => {
    sdkState.nextUser = { ...sdkState.nextUser, emailVerified: false } as FirebaseUser;
    mount();
    await waitFor(() => expect(context.user).toEqual(restoredUser));
    await act(async () => context.logout());

    await act(async () => {
      await firebase.signUpWithEmail("new@example.test", "password", "New User");
    });

    await waitFor(() => expect(context.firebaseUser).toBe(sdkState.nextUser));
    expect(context.user).toBeNull();
    expect(fetchMock.mock.calls.filter(([url]) => url === "/auth/login")).toHaveLength(0);
  });

  it("cancels a sign-in waiting for Firebase when the provider unmounts", async () => {
    const view = mount();
    await waitFor(() => expect(context.user).toEqual(restoredUser));
    sdkState.reportInitialState = false;
    let signIn!: Promise<FirebaseUser>;
    act(() => {
      signIn = firebase.signInWithGoogle();
    });
    // Attach the rejection handler before unmounting releases the pending preparation.
    const cancelled = expect(signIn).rejects.toThrow("Sign-in was cancelled");
    await waitFor(() => expect(sdkState.listeners.size).toBe(1));

    view.unmount();

    await cancelled;
    expect(sdkState.auth.currentUser).toBeNull();
    expect(fetchMock.mock.calls.filter(([url]) => url === "/auth/login")).toHaveLength(0);
  });
});
