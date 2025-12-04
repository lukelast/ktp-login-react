import type { RouteObject } from "react-router-dom";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { PasswordResetPage } from "./components/PasswordResetPage";
import { EmailSignInPage } from "./components/EmailSignInPage";
import { PasswordSignInPage } from "./components/PasswordSignInPage";
import { EmailVerificationPage } from "./components/EmailVerificationPage";
import { AnonymousLoginPage } from "./components/AnonymousLoginPage";
import { getAuthConfig } from "./config";

export const getAuthRoutes = (): RouteObject[] => {
  const {
    auth: { routes },
  } = getAuthConfig();

  return [
    {
      path: routes.login,
      element: <LoginPage />,
    },
    {
      path: routes.signup,
      element: <SignupPage />,
    },
    {
      path: routes.resetPassword,
      element: <PasswordResetPage />,
    },
    {
      path: routes.signInWithEmail,
      element: <EmailSignInPage />,
    },
    {
      path: routes.signInWithPassword,
      element: <PasswordSignInPage />,
    },
    {
      path: routes.verifyEmail,
      element: <EmailVerificationPage />,
    },
    {
      path: routes.anonymousLogin,
      element: <AnonymousLoginPage />,
    },
  ];
};
