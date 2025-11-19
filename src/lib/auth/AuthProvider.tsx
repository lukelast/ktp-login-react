import React, {
  ReactNode,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { User as FirebaseUser } from "firebase/auth";
import { subscribeToAuthState, signOutUser } from "../firebase/firebase";
import { AuthService } from "./AuthService";
import { User } from "./types";
import { AuthContext } from "./AuthContext";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
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
        setUser(user);
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
      await syncWithBackend(firebaseUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
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
    () => ({ user, firebaseUser, isLoading, logout }),
    [user, firebaseUser, isLoading, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
