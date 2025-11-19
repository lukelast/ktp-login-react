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

  if (!user) {
    return <LoginPage redirectTo={location.pathname + location.search} />;
  }

  return children ? <>{children}</> : <Outlet />;
};
