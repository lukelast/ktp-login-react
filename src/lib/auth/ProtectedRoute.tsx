import type React from "react";
import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAuthConfig } from "../config";
import { useAuth } from "./useAuth";
import { LoginPage } from "../components/LoginPage";

interface ProtectedRouteProps {
  children?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, firebaseUser, isEmailVerified, isLoading } = useAuth();
  const location = useLocation();
  const config = getAuthConfig();
  const redirectTo = location.pathname + location.search;

  if (isLoading) {
    return (
      <div className="ktp-loading-overlay">
        <div className="ktp-loading-card">
          <div className="ktp-loading-content">
            <div className="ktp-spinner"></div>
            <p className="ktp-loading-text">Signing in...</p>
          </div>
        </div>
      </div>
    );
  }

  if (firebaseUser && !isEmailVerified) {
    return <Navigate to={config.auth.routes.verifyEmail} state={{ redirectTo }} replace />;
  }

  if (!user) {
    return <LoginPage redirectTo={redirectTo} />;
  }

  return children ?? <Outlet />;
};
