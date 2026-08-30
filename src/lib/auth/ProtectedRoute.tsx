import type React from "react";
import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAuthConfig } from "../config";
import { useAuth } from "./useAuth";
import { LoginPage } from "../components/LoginPage";
import { needsEmailValidation } from "./util";

interface ProtectedRouteProps {
  children?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, firebaseUser, syncError, isLoading, refreshUser } = useAuth();
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

  if (needsEmailValidation(firebaseUser)) {
    return <Navigate to={config.auth.routes.verifyEmail} state={{ redirectTo }} replace />;
  }

  // A broken backend is not "signed out": showing the login form would just fail the same way.
  if (syncError) {
    return (
      <div className="ktp-page">
        <div className="ktp-card">
          <h1 className="ktp-title-sm">Sign-in unavailable</h1>
          <div className="ktp-content ktp-space-y-4">
            <div className="ktp-error">
              <div className="ktp-error-text">{syncError}</div>
            </div>
            <p className="ktp-text">
              Your account is fine — the server had a problem confirming your session. Try again in
              a moment.
            </p>
            <button
              type="button"
              className="ktp-btn-primary"
              // The failure is already reflected in syncError; nothing to reject to here.
              onClick={() => void refreshUser().catch(() => undefined)}
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage redirectTo={redirectTo} />;
  }

  return children ?? <Outlet />;
};
