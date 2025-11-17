import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithEmail,
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleEmailSignIn = () =>
    handleLogin(() => signInWithEmail(email, password));
  const handleGitHubLogin = () => handleLogin(signInWithGitHub);
  const handleMicrosoftLogin = () => handleLogin(signInWithMicrosoft);
  const handleGoogleLogin = () => handleLogin(signInWithGoogle);
  const handleFacebookLogin = () => handleLogin(signInWithFacebook);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleEmailSignIn();
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-8"></div>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          {document.title}
        </h1>
        <p className="text-lg text-gray-600 mb-8">Please log in</p>
        <div className="w-full max-w-md mx-auto space-y-4">
          <div className="space-y-3">
            {enabledProviders.includes(GoogleAuthProvider.PROVIDER_ID) && (
              <button
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition duration-200 relative"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg
                  className="w-5 h-5 absolute left-4"
                  viewBox="0 0 48 48"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  ></path>
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  ></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}

            {enabledProviders.includes(GithubAuthProvider.PROVIDER_ID) && (
              <button
                onClick={handleGitHubLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition duration-200 relative"
              >
                <svg
                  className="w-5 h-5 absolute left-4"
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
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition duration-200 relative"
              >
                <svg
                  className="w-5 h-5 absolute left-4"
                  viewBox="0 0 23 23"
                >
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
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition duration-200 relative"
              >
                <svg
                  className="w-5 h-5 absolute left-4"
                  fill="#1877F2"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Sign in with Facebook</span>
              </button>
            )}
          </div>

          {enabledProviders.includes(EmailAuthProvider.PROVIDER_ID) && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Sign In
                </button>
              </form>

              <div className="text-sm text-center space-y-2">
                <div>
                  Don&apos;t have an account?{" "}
                  <Link
                    to={config.auth.routes.signup}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Sign up
                  </Link>
                </div>
                <div>
                  <Link
                    to={config.auth.routes.resetPassword}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
