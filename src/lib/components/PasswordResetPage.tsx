import type React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { resetPassword } from "../firebase/firebase";
import { getAuthConfig } from "../config";

export const PasswordResetPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const config = getAuthConfig();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await resetPassword(email);
      setSuccess("Password reset email sent. Check your inbox.");
      setEmail("");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send password reset email.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ktp-page">
      <div className="ktp-card-form">
        <div className="ktp-text-center">
          <h1 className="ktp-title-sm">
            Reset Password
          </h1>
          <p className="ktp-text">
            Enter your email to receive a password reset link
          </p>
        </div>

        <form onSubmit={handlePasswordReset} className="ktp-space-y-4">
          <div>
            <label
              htmlFor="email"
              className="ktp-label"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="ktp-input"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="ktp-btn-primary"
          >
            {isLoading ? "Sending..." : "Send Reset Email"}
          </button>
        </form>

        <div className="ktp-links ktp-mt-6">
          <div>
            <Link
              to={config.auth.routes.signInWithPassword}
              className="ktp-link"
            >
              Go Back
            </Link>
          </div>
        </div>

        {success && (
          <div className="ktp-success">
            <div className="ktp-success-text">{success}</div>
          </div>
        )}

        {error && (
          <div className="ktp-error" style={{ marginTop: '1rem' }}>
            <div className="ktp-error-text">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
};
