import type { User as FirebaseUser } from "@firebase/auth";

export const needsEmailValidation = (user: FirebaseUser | null) => {
  if (user == null) {
    return false;
  }
  if (user.isAnonymous) {
    return false;
  }
  return !user.emailVerified;
};
