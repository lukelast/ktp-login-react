import type { User as FirebaseUser } from "firebase/auth";

export interface User {
  userId: string;
  nameFull: string;
  email: string;
  nameFirst: string;
}

export interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<FirebaseUser | null>;
}
