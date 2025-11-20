import type React from "react";
import {type 
  ReactNode,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react"
import type { User as FirebaseUser } from "firebase/auth";
import {
  subscribeToAuthState,
  signOutUser,
  reloadCurrentUser,
} from "../firebase/firebase";
import { AuthService } from "./AuthService";
import type { User } from "./types";
import { AuthContext } from "./AuthContext";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const syncWithBackend = useCallback(
    async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setUser(null);
        return;
      }

      try {
        const idToken = await firebaseUser.getIdToken();
        const user = await AuthService.login(idToken);
        setUser(user ?? null);
      } catch (error) {
        console.error("Error syncing with backend:", error);
        setUser(null);
      }
    },
    []
  );

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      setIsLoading(true);
      setFirebaseUser(firebaseUser);
      const verified = firebaseUser?.emailVerified ?? false;
      setIsEmailVerified(verified);

      if (firebaseUser && verified) {
        await syncWithBackend(firebaseUser);
      } else {
        setUser(null);
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

      const verified = refreshedUser?.emailVerified ?? false;
      setIsEmailVerified(verified);

      if (refreshedUser && verified) {
        await syncWithBackend(refreshedUser);
      } else if (!verified) {
        setUser(null);
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
      setIsEmailVerified(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      firebaseUser,
      isEmailVerified,
      isLoading,
      logout,
      refreshUser,
    }),
    [user, firebaseUser, isEmailVerified, isLoading, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
