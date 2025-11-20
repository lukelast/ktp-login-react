import type React from "react";
import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {isAuthSignInWithEmailLink, sendAuthLinkToEmail, signInWithAuthEmailLink,} from "../firebase/firebase";
import {getAuthConfig} from "../config";

export const EmailSignInPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const config = getAuthConfig();

  useEffect(() => {
    if (isAuthSignInWithEmailLink(window.location.href)) {
      let emailForSignIn = window.localStorage.getItem("emailForSignIn");
      if (!emailForSignIn) {
        emailForSignIn = window.prompt(
          "Please provide your email for confirmation"
        );
      }

      if (emailForSignIn) {
        setIsLoading(true);
        signInWithAuthEmailLink(emailForSignIn, window.location.href)
          .then(() => {
            window.localStorage.removeItem("emailForSignIn");
            // You can access the new user via result.user
            // Additional user info profile not available via:
            // result.additionalUserInfo.profile == null
            // You can check if the user is new or existing:
            // result.additionalUserInfo.isNewUser
            window.location.href = config.auth.routes.afterLogin;
          })
          .catch((error) => {
            console.error("Error signing in with email link", error);
            setError(error.message);
            setIsLoading(false);
          });
      }
    }
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
            <div className="ktp-success-message">
              <p>We sent an email to <strong>{email}</strong>. Click the link in the email to sign in. If you can't find
                the email check your spam folder.</p>
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
              Enter your email address and we'll send you a link to sign in. You don't need to create an account first.
            </p>

            <form onSubmit={handleSendLink} className="ktp-space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="ktp-input"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="ktp-btn-primary"
              >
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
