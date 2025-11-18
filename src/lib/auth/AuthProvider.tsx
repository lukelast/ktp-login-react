import React, {
  ReactNode,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { User as FirebaseUser } from "firebase/auth";
import { subscribeToAuthState, signOutUser } from "../firebase/firebase";
import { getAuthConfig } from "../config";
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
        const config = getAuthConfig();
        const idToken = await firebaseUser.getIdToken();

        const loginRes = await fetch(config.auth.endpoints.login, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken }),
        });

        if (loginRes.ok) {
          const loginData = await loginRes.json();
          if (loginData.user) {
            setUser(loginData.user);
          } else {
            console.error("Login succeeded but no user data returned");
            setUser(null);
          }
        } else {
          console.error("Backend login failed");
          setUser(null);
        }
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
      const config = getAuthConfig();
      await signOutUser();
      await fetch(config.auth.endpoints.logout, { method: "POST" });
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
