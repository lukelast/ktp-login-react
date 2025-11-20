import type React from "react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { sendVerificationEmail } from "../firebase/firebase";
import { useAuth } from "../auth/useAuth";
import { getAuthConfig } from "../config";

export const EmailVerificationPage: React.FC = () => {
  const { firebaseUser, isEmailVerified, isLoading, refreshUser } = useAuth();

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const config = getAuthConfig();

  const redirectTo =
    (location.state as { redirectTo?: string } | null)?.redirectTo;
  const destination = redirectTo || config.auth.routes.afterLogin;

  useEffect(() => {
    if (!isLoading && isEmailVerified) {
      navigate(destination, { replace: true });
    }
  }, [destination, isEmailVerified, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && !firebaseUser) {
      navigate(config.auth.routes.login, { replace: true });
    }
  }, [config.auth.routes.login, firebaseUser, isLoading, navigate]);

  const handleSendVerificationEmail = async () => {
    if (!firebaseUser) {
      setError("You need to be signed in to verify your email.");
      return;
    }

    setError(null);
    setStatusMessage(null);
    setIsSending(true);

    try {
      await sendVerificationEmail();
      setStatusMessage(
        "Verification email sent. Please check your inbox and spam folder."
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send verification email.";
      setError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckVerification = async () => {
    setError(null);
    setStatusMessage(null);
    setIsChecking(true);

    try {
      const refreshedUser = await refreshUser();
      if (refreshedUser?.emailVerified) {
        setStatusMessage("Email verified! Redirecting...");
        navigate(destination, { replace: true });
      } else {
        setStatusMessage(
          "Still waiting for verification. If you don't see the email, check your spam folder and try again."
        );
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to check verification status right now.";
      setError(errorMessage);
    } finally {
      setIsChecking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="ktp-loading-overlay">
        <div className="ktp-loading-card">
          <div className="ktp-loading-content">
            <div className="ktp-spinner"></div>
            <p className="ktp-loading-text">Checking your account...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ktp-page">
      <div className="ktp-card-form">
        <div className="ktp-text-center">
          <h1 className="ktp-title-sm">Verify your email</h1>
          <p className="ktp-text">
            We sent a verification link to{" "}
            <strong>{firebaseUser?.email || "your email address"}</strong>.{" "}
            Please check your inbox or spam folder, then click the link to
            continue.
          </p>
        </div>

        <div className="ktp-space-y-4">
          <button
            type="button"
            onClick={handleSendVerificationEmail}
            disabled={isSending || isChecking}
            className="ktp-btn-primary"
          >
            {isSending ? "Sending..." : "Resend verification email"}
          </button>

          <button
            type="button"
            onClick={handleCheckVerification}
            disabled={isChecking || isSending}
            className="ktp-btn-primary"
          >
            {isChecking ? "Checking status..." : "I verified my email"}
          </button>

          <div className="ktp-text">
            If you don&apos;t see the email, check your spam folder or try
            sending it again.
          </div>

          {statusMessage && (
            <div className="ktp-success">
              <div className="ktp-success-text">{statusMessage}</div>
            </div>
          )}

          {error && (
            <div className="ktp-error">
              <div className="ktp-error-text">{error}</div>
            </div>
          )}
        </div>

        <div className="ktp-links">
          <Link to={config.auth.routes.login} className="ktp-link">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
