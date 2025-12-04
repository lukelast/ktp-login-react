import type React from "react";
import { type ReactNode, useEffect, useState, useMemo, useCallback } from "react";
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

  const syncWithBackend = useCallback(
    async (firebaseUser: FirebaseUser | null, forceRefresh = false) => {
      if (!firebaseUser) {
        setUser(null);
        return;
      }

      try {
        const idToken = await firebaseUser.getIdToken(forceRefresh);
        const user = await AuthService.login(idToken);
        setUser(user ?? null);
      } catch (error) {
        console.error("Error syncing with backend:", error);
        setUser(null);
      }
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      setIsLoading(true);
      setFirebaseUser(firebaseUser);

      if (needsEmailValidation(firebaseUser)) {
        setUser(null);
      } else if (firebaseUser) {
        await syncWithBackend(firebaseUser);
      }

      setIsLoading(false);
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
    } catch (error) {
      console.error("Error refreshing user:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [syncWithBackend]);

  const logout = useCallback(async () => {
    try {
      await signOutUser();
      await AuthService.logout();
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      firebaseUser,
      isLoading,
      logout,
      refreshUser,
    }),
    [user, firebaseUser, isLoading, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
