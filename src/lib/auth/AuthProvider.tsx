import type React from "react";
import { type ReactNode, useEffect, useState, useMemo, useCallback, useRef } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { subscribeToAuthState, signOutUser, reloadCurrentUser } from "../firebase/firebase";
import { AuthService } from "./AuthService";
import type { User } from "./types";
import { AuthContext } from "./AuthContext";
import { needsEmailValidation } from "./util";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutInFlight = useRef<Promise<void> | null>(null);

  const syncWithBackend = useCallback(
    async (firebaseUser: FirebaseUser | null, forceRefresh = false) => {
      if (!firebaseUser) {
        setUser(null);
        return;
      }

      try {
        const idToken = await firebaseUser.getIdToken(forceRefresh);
        setUser(await AuthService.login(idToken));
      } catch (error) {
        setUser(null);
        throw error;
      }
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      setIsLoading(true);
      setFirebaseUser(firebaseUser);

      try {
        if (needsEmailValidation(firebaseUser)) {
          setUser(null);
        } else if (firebaseUser) {
          await syncWithBackend(firebaseUser);
        }
      } catch (error) {
        // The auth state listener has no caller to reject to.
        console.error("Error syncing with backend:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [syncWithBackend]);

  const refreshUser = useCallback(async (): Promise<FirebaseUser | null> => {
    setIsLoading(true);
    try {
      const refreshedUser = await reloadCurrentUser();
      setFirebaseUser(refreshedUser);

      if (needsEmailValidation(refreshedUser)) {
        setUser(null);
      } else if (refreshedUser) {
        await syncWithBackend(refreshedUser, true);
      }

      return refreshedUser;
    } finally {
      setIsLoading(false);
    }
  }, [syncWithBackend]);

  const logout = useCallback((): Promise<void> => {
    // Coalesce concurrent calls so a double-click can't fire duplicate requests.
    if (logoutInFlight.current) {
      return logoutInFlight.current;
    }

    const run = async () => {
      // End the backend session before touching anything local: if this fails,
      // the user is still fully signed in and the caller can surface the error
      // and retry. Tearing down local state first is how a failed sign-out ends
      // up looking signed out while the session cookie lives on.
      await AuthService.logout();
      await signOutUser();
      setUser(null);
      setFirebaseUser(null);
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
      isLoading,
      isLoggingOut,
      logout,
      refreshUser,
    }),
    [user, firebaseUser, isLoading, isLoggingOut, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
