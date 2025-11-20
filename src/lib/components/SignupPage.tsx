import type React from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUpWithEmail } from "../firebase/firebase";
import { getAuthConfig } from "../config";

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const config = getAuthConfig();
  const minPasswordLength = config.auth.password?.minLength ?? 8;

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name is required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < minPasswordLength) {
      setError(`Password must be at least ${minPasswordLength} characters long`);
      return;
    }

    setIsLoading(true);
    try {
      await signUpWithEmail(email, password, trimmedName);
      navigate(config.auth.routes.afterSignup);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create account";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ktp-page">
      <div className="ktp-card-form">
        <div className="ktp-text-center">
          <h1 className="ktp-title-sm">Create Account</h1>
        </div>

        <div className="ktp-space-y-4">
          <form onSubmit={handleEmailSignUp} className="ktp-space-y-4">
            <div>
              <label htmlFor="name" className="ktp-label">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="ktp-input"
              />
            </div>

            <div>
              <label htmlFor="email" className="ktp-label">
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

            <div>
              <label htmlFor="password" className="ktp-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                minLength={minPasswordLength}
                className="ktp-input"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="ktp-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={minPasswordLength}
                className="ktp-input"
              />
            </div>

            <button type="submit" disabled={isLoading} className="ktp-btn-primary">
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="ktp-links">
            Already have an account?{" "}
            <Link to={config.auth.routes.login} className="ktp-link">
              Sign in
            </Link>
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
