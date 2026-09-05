import type React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  isAuthSignInWithEmailLink,
  sendAuthLinkToEmail,
  signInWithAuthEmailLink,
} from "../firebase/firebase";
import { getAuthConfig } from "../config";

export const EmailSignInPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Whether this URL is a sign-in link is Firebase's call, and Firebase loads lazily, so the page
  // starts out loading and settles once that is known (into completing the sign-in, or the form).
  const [isLoading, setIsLoading] = useState(true);
  const config = getAuthConfig();

  useEffect(() => {
    let active = true;

    const completeLinkSignIn = async () => {
      if (!(await isAuthSignInWithEmailLink(window.location.href))) {
        return;
      }
      let emailForSignIn = window.localStorage.getItem("emailForSignIn");
      if (!emailForSignIn) {
        emailForSignIn = window.prompt("Please provide your email for confirmation");
      }
      if (!emailForSignIn) {
        // Prompt dismissed; fall through to the form to request a fresh link.
        return;
      }
      await signInWithAuthEmailLink(emailForSignIn, window.location.href);
      window.localStorage.removeItem("emailForSignIn");
      window.location.href = config.auth.routes.afterLogin;
    };

    completeLinkSignIn()
      .catch((error: unknown) => {
        console.error("Error signing in with email link", error);
        if (active) {
          setError(error instanceof Error ? error.message : "Error signing in with email link");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [config.auth.routes.afterLogin]);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const actionCodeSettings = {
      // URL you want to redirect back to. The domain (www.example.com) for this
      // URL must be in the authorized domains list in the Firebase Console.
      url: window.location.href,
      handleCodeInApp: true,
    };

    try {
      await sendAuthLinkToEmail(email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      setIsSent(true);
    } catch (error: unknown) {
      console.error("Error sending email link:", error);
      const errorMessage = error instanceof Error ? error.message : "Error sending email link";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="ktp-page">
        <div className="ktp-card">
          <div className="ktp-loading-content">
            <div className="ktp-spinner"></div>
            <p className="ktp-loading-text">Processing...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ktp-page">
      <div className="ktp-card">
        <h1 className="ktp-title">Sign in with Email</h1>

        {isSent ? (
          <div className="ktp-content ktp-space-y-4">
            <div className="ktp-success">
              <p>
                We sent an email to <strong>{email}</strong>. Click the link in the email to sign
                in.
              </p>
              <p>If you can't find the email check your spam folder.</p>
            </div>
            <div className="ktp-links">
              <Link to={config.auth.routes.login} className="ktp-link">
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          <div className="ktp-content ktp-space-y-4">
            <p className="ktp-subtitle">
              Enter your email address and we'll send you a link to sign in. You don't need to
              create an account first.
            </p>

            <form onSubmit={handleSendLink} className="ktp-space-y-4">
              <div>
                <input
                  type="email"
                  id="emailLinkAddress"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  autoComplete="email"
                  className="ktp-input"
                />
              </div>

              <button type="submit" disabled={isLoading} className="ktp-btn-primary">
                Send Sign In Link
              </button>
            </form>

            {error && (
              <div className="ktp-error">
                <div className="ktp-error-text">{error}</div>
              </div>
            )}

            <div className="ktp-links">
              <Link to={config.auth.routes.login} className="ktp-link">
                Back to login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
