import React, { ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import { LoginPage } from "../components/LoginPage";

interface ProtectedRouteProps {
  children?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading authentication status...</div>;
  }

  if (!user) {
    return <LoginPage redirectTo={location.pathname + location.search} />;
  }

  return children ? <>{children}</> : <Outlet />;
};
