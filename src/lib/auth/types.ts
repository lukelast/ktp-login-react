import { User as FirebaseUser } from "firebase/auth";

export interface User {
  userId: string;
  nameFull: string;
  email: string;
  nameFirst: string;
  subscription?: string;
}

export interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}
