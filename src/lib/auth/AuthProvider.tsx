import type React from "react";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { AuthClientConfigError } from "../config";
import {
  onBeforeFirebaseSignIn,
  reloadCurrentUser,
  signOutUser,
  subscribeToAuthState,
} from "../firebase/firebase";
import { AuthContext } from "./AuthContext";
import { AuthBackendError, AuthService } from "./AuthService";
import type { User } from "./types";
import { needsEmailValidation } from "./util";

/**
 * Maps a failed session exchange to a presentable message, or null for a credential rejection:
 * being refused by the backend means "signed out", not "something is broken".
 */
const syncFailureMessage = (error: unknown): string | null => {
  if (error instanceof AuthBackendError) {
    return error.isAuthRejection
      ? null
      : `The server failed to sign you in (HTTP ${error.status}).`;
  }
  if (error instanceof AuthClientConfigError) {
    return "The server could not provide the sign-in configuration.";
  }
  return "The server could not be reached to sign you in.";
};

/**
 * Session state for the app. The session cookie is the source of truth: a page load asks the
 * backend for the user it identifies and, when there is one, never touches Firebase. Firebase
 * starts when there is no session or an explicit sign-in begins, and from then on its auth-state
 * changes drive the session.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutInFlight = useRef<Promise<void> | null>(null);
  // Non-null once Firebase is in play; null while the cookie alone carries the session.
  const firebaseSubscription = useRef<{
    ready: Promise<void>;
    unsubscribe: () => void;
  } | null>(null);

  /** Adopts a Firebase auth state: exchanges a usable user for a session, or clears the user. */
  const applyFirebaseUser = useCallback(
    async (nextFirebaseUser: FirebaseUser | null, forceRefresh = false) => {
      setFirebaseUser(nextFirebaseUser);
      // A null user clears the backend user too — a sign-out is a sign-out.
      if (!nextFirebaseUser || needsEmailValidation(nextFirebaseUser)) {
        setUser(null);
        setSyncError(null);
        return;
      }
      try {
        const idToken = await nextFirebaseUser.getIdToken(forceRefresh);
        setUser(await AuthService.login(idToken));
        setSyncError(null);
      } catch (error) {
        setUser(null);
        setSyncError(syncFailureMessage(error));
        throw error;
      }
    },
    [],
  );

  /**
   * Starts Firebase and resolves once its persisted auth state has been applied; the caller owns
   * `isLoading` for that first state, the listener owns it for every later change.
   */
  const startFirebase = useCallback(
    (isCurrent: () => boolean): Promise<void> => {
      if (firebaseSubscription.current) return firebaseSubscription.current.ready;

      let cancel = () => {};
      const ready = new Promise<void>((resolve, reject) => {
        let active = true;
        let settled = false;
        const unsubscribe = subscribeToAuthState(
          (nextFirebaseUser) => {
            if (!active || !isCurrent()) return;
            const initial = !settled;
            settled = true;
            const run = async () => {
              if (!initial) setIsLoading(true);
              try {
                await applyFirebaseUser(nextFirebaseUser);
              } catch (error) {
                // The auth state listener has no caller to reject to.
                console.error("Error syncing with backend:", error);
              } finally {
                if (initial) {
                  resolve();
                } else {
                  setIsLoading(false);
                }
              }
            };
            void run();
          },
          (error) => {
            if (!active || !isCurrent()) return;
            if (!settled) {
              settled = true;
              firebaseSubscription.current = null;
              active = false;
              unsubscribe();
              reject(error);
            }
          },
        );
        cancel = () => {
          active = false;
          unsubscribe();
          // Release callers waiting for the first state when the provider unmounts.
          resolve();
        };
      });
      firebaseSubscription.current = { ready, unsubscribe: cancel };
      return ready;
    },
    [applyFirebaseUser],
  );

  /** Cookie first; Firebase only when the cookie holds no session. */
  const establishSession = useCallback(
    async (isCurrent: () => boolean) => {
      const subscriptionAtRequest = firebaseSubscription.current;
      const sessionUser = await AuthService.session();
      if (!isCurrent()) return;
      // An explicit sign-in may have started while this cookie read was in flight.
      if (firebaseSubscription.current !== subscriptionAtRequest) return;
      if (sessionUser) {
        setUser(sessionUser);
        setSyncError(null);
        return;
      }
      if (firebaseSubscription.current === null) {
        await startFirebase(isCurrent);
        return;
      }
      // Firebase is already listening and has reported no user: signed out.
      setUser(null);
      setSyncError(null);
    },
    [startFirebase],
  );

  useEffect(() => {
    // Flipped by cleanup so a start still in flight cannot subscribe or set state afterwards.
    let cancelled = false;
    const isCurrent = () => !cancelled;

    const run = async (establish: () => Promise<void>) => {
      try {
        await establish();
      } catch (error) {
        if (isCurrent()) {
          setUser(null);
          setSyncError(syncFailureMessage(error));
        }
        throw error;
      } finally {
        if (isCurrent()) setIsLoading(false);
      }
    };
    const stopPreparingSignIns = onBeforeFirebaseSignIn(async () => {
      if (firebaseSubscription.current) {
        await firebaseSubscription.current.ready;
      } else {
        setIsLoading(true);
        await run(() => startFirebase(isCurrent));
      }
      if (!isCurrent()) throw new Error("Sign-in was cancelled because AuthProvider unmounted");
    });
    void run(() => establishSession(isCurrent)).catch((error: unknown) => {
      console.error("Error establishing session:", error);
    });

    return () => {
      cancelled = true;
      stopPreparingSignIns();
      firebaseSubscription.current?.unsubscribe();
      firebaseSubscription.current = null;
    };
  }, [establishSession, startFirebase]);

  const refreshUser = useCallback(async (): Promise<FirebaseUser | null> => {
    setIsLoading(true);
    try {
      if (firebaseSubscription.current !== null) {
        // Firebase is in play (a sign-in or verification is underway): it is the source of truth.
        const refreshedUser = await reloadCurrentUser();
        if (refreshedUser) {
          await applyFirebaseUser(refreshedUser, true);
          return refreshedUser;
        }
        setFirebaseUser(null);
      }
      await establishSession(() => true);
      return null;
    } catch (error) {
      setUser(null);
      setSyncError(syncFailureMessage(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [applyFirebaseUser, establishSession]);

  const logout = useCallback((): Promise<void> => {
    // Coalesce concurrent calls so a double-click can't fire duplicate requests.
    if (logoutInFlight.current) {
      return logoutInFlight.current;
    }

    const run = async () => {
      // End the backend session before touching anything local: if this fails, the user is
      // still fully signed in and the caller can surface the error and retry.
      await AuthService.logout();
      // Firebase may hold a persisted user this page never loaded (the session came from the
      // cookie), and it would sign the user straight back in on the next load, so always clear
      // it. The cookie is already gone, so a failure here must not undo the sign-out.
      try {
        await signOutUser();
      } catch (error) {
        console.warn("Backend session ended but Firebase sign-out failed:", error);
      }
      setUser(null);
      setFirebaseUser(null);
      setSyncError(null);
    };

    setIsLoggingOut(true);
    const promise = run().finally(() => {
      logoutInFlight.current = null;
      setIsLoggingOut(false);
    });
    logoutInFlight.current = promise;
    return promise;
  }, []);

  const value = useMemo(
    () => ({
      user,
      firebaseUser,
      syncError,
      isLoading,
      isLoggingOut,
      logout,
      refreshUser,
    }),
    [user, firebaseUser, syncError, isLoading, isLoggingOut, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
