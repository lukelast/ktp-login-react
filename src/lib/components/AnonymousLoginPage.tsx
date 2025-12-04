import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInAnonymousUser } from "../firebase/firebase";
import { useAuth } from "../auth/useAuth";
import { getAuthConfig } from "../config";

export const AnonymousLoginPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const config = getAuthConfig();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="ktp-page">
        <div className="ktp-card">
          <div className="ktp-skeleton">
            <div className="ktp-skeleton-title"></div>
            <div className="ktp-skeleton-text"></div>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    navigate(config.auth.routes.afterLogin);
    return null;
  }

  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signInAnonymousUser();
      navigate(config.auth.routes.afterLogin);
    } catch (error: unknown) {
      console.error("Anonymous login failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Anonymous login failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ktp-page">
      <div className="ktp-card">
        <h1 className="ktp-title">Anonymous Login</h1>
        <p className="ktp-subtitle">Sign in temporarily without an account</p>
        <p className="ktp-subtitle">
          Note your account will not be saved and you will not be able to access it again.
        </p>

        <div className="ktp-content ktp-space-y-4">
          <div className="ktp-space-y-3">
            <button
              type="button"
              onClick={handleAnonymousLogin}
              className="ktp-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in Anonymously"}
            </button>
          </div>

          {error && (
            <div className="ktp-error">
              <div className="ktp-error-text">{error}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
