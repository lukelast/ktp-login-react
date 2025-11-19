import { RouteObject } from "react-router-dom";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { PasswordResetPage } from "./components/PasswordResetPage";
import { getAuthConfig } from "./config";

export const getAuthRoutes = (): RouteObject[] => {
    const { auth: { routes } } = getAuthConfig();

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
    ];
};

