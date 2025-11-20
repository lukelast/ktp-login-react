import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithGitHub,
  signInWithMicrosoft,
  signInWithGoogle,
  signInWithFacebook,
  MICROSOFT_PROVIDER_ID,
} from "../firebase/firebase";
import { useAuth } from "../auth/useAuth";
import { getAuthConfig } from "../config";
import {
  User,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  EmailAuthProvider,
} from "firebase/auth";

interface LoginPageProps {
  redirectTo?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ redirectTo }) => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const config = getAuthConfig();
  const enabledProviders = config.auth.enabledProviders;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectTo || config.auth.routes.afterLogin);
    }
  }, [user, authLoading, navigate, redirectTo, config.auth.routes.afterLogin]);

  const handleLogin = async (loginFn: () => Promise<User>) => {
    setIsLoading(true);
    setError(null);

    try {
      await loginFn();
      navigate(redirectTo || config.auth.routes.afterLogin);
    } catch (error: unknown) {
      console.error("Login failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = () => handleLogin(signInWithGitHub);
  const handleMicrosoftLogin = () => handleLogin(signInWithMicrosoft);
  const handleGoogleLogin = () => handleLogin(signInWithGoogle);
  const handleFacebookLogin = () => handleLogin(signInWithFacebook);

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
    return null;
  }

  return (
    <div className="ktp-page">
      <div className="ktp-card">
        <h1 className="ktp-title">{document.title}</h1>
        <p className="ktp-subtitle">Please sign in</p>
        <div className="ktp-content ktp-space-y-4">
          <div className="ktp-space-y-3">
            {enabledProviders.includes(GoogleAuthProvider.PROVIDER_ID) && (
              <button
                className="ktp-btn-oauth"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="ktp-btn-icon" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}

            {enabledProviders.includes(GithubAuthProvider.PROVIDER_ID) && (
              <button
                onClick={handleGitHubLogin}
                disabled={isLoading}
                className="ktp-btn-oauth"
              >
                <svg
                  className="ktp-btn-icon"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Sign in with GitHub</span>
              </button>
            )}

            {enabledProviders.includes(MICROSOFT_PROVIDER_ID) && (
              <button
                onClick={handleMicrosoftLogin}
                disabled={isLoading}
                className="ktp-btn-oauth"
              >
                <svg className="ktp-btn-icon" viewBox="0 0 23 23">
                  <path fill="#F14F21" d="M1 1h10v10H1V1z" />
                  <path fill="#7EB900" d="M12 1h10v10H12V1z" />
                  <path fill="#00A3EE" d="M1 12h10v10H1V12z" />
                  <path fill="#FEB800" d="M12 12h10v10H12V12z" />
                </svg>
                <span>Sign in with Microsoft</span>
              </button>
            )}

            {enabledProviders.includes(FacebookAuthProvider.PROVIDER_ID) && (
              <button
                onClick={handleFacebookLogin}
                disabled={isLoading}
                className="ktp-btn-oauth"
              >
                <svg
                  className="ktp-btn-icon"
                  fill="#1877F2"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Sign in with Facebook</span>
              </button>
            )}

            {enabledProviders.includes(EmailAuthProvider.PROVIDER_ID) && (
              <button
                onClick={() => navigate(config.auth.routes.signInWithEmail)}
                className="ktp-btn-oauth"
                disabled={isLoading}
              >
                <svg
                  className="ktp-btn-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>Passwordless email sign in</span>
              </button>
            )}

            {enabledProviders.includes(EmailAuthProvider.PROVIDER_ID) && (
              <button
                onClick={() => navigate(config.auth.routes.signInWithPassword)}
                className="ktp-btn-oauth"
                disabled={isLoading}
              >
                <svg
                  className="ktp-btn-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>Sign in with Email & Password</span>
              </button>
            )}
          </div>

          {error && (
            <div className="ktp-error">
              <div className="ktp-error-text">{error}</div>
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {(isLoading || authLoading) && (
        <div className="ktp-loading-overlay">
          <div className="ktp-loading-card">
            <div className="ktp-loading-content">
              <div className="ktp-spinner"></div>
              <p className="ktp-loading-text">Signing in...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
