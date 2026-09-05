import type { User as FirebaseUser } from "firebase/auth";

/** The signed-in user as the backend reports it; identical from `/auth/login` and `/auth/session`. */
export interface User {
  userId: string;
  email: string;
  nameFull: string;
  nameFirst: string;
  roles: string[];
}

export interface AuthContextType {
  user: User | null;
  /**
   * Null whenever the session was restored from the cookie alone, which is the normal page load:
   * Firebase only enters the picture to establish a session, not to keep one.
   */
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  /**
   * Presentable message for a backend session exchange that failed for a reason other than the
   * credentials — a 500, an unreachable server, a timeout. While set, the sign-in state is
   * unknown rather than signed out, and ProtectedRoute shows an error screen instead of the
   * login page. Null after a successful sync, a credential rejection (that is plain
   * `user: null`), or sign-out.
   */
  syncError: string | null;
  /** True while a logout is in flight, so apps can disable their sign-out control. */
  isLoggingOut: boolean;
  /**
   * Signs out Firebase, then ends the backend session and clears the displayed user.
   * If either step fails, rejects and keeps the displayed user so the caller can
   * surface the error and retry. Firebase may already be signed out at that point.
   * Concurrent calls share the same in-flight promise.
   */
  logout: () => Promise<void>;
  /**
   * Re-establishes the session: reloads the Firebase user when one is in play, otherwise
   * re-checks the cookie. Returns the Firebase user, or null when the session is cookie-only.
   */
  refreshUser: () => Promise<FirebaseUser | null>;
}
