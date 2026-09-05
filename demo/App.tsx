import type React from "react";
import { useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { AuthRoutes, getAuthConfig, ProtectedRoute, useAuth } from "../src";

import "./demoStyles.css";

const SKIN_CLASS = "demo-skin";

/**
 * Flips the demo skin on and off. The skin is nothing but a different set of `--ktp-*` tokens in
 * demoStyles.css, so this shows what an app's theme override does to every screen.
 */
const SkinToggle: React.FC = () => {
  const [skinned, setSkinned] = useState(() =>
    document.documentElement.classList.contains(SKIN_CLASS),
  );
  const toggle = () => {
    document.documentElement.classList.toggle(SKIN_CLASS, !skinned);
    setSkinned(!skinned);
  };
  return (
    <label className="demo-skin-toggle">
      <input type="checkbox" checked={skinned} onChange={toggle} />
      Demo skin (token override)
    </label>
  );
};

const Dashboard: React.FC = () => {
  const { user, firebaseUser, logout, isLoggingOut } = useAuth();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = () => {
    setLogoutError(null);
    logout().catch((error: unknown) => {
      setLogoutError(error instanceof Error ? error.message : "Logout failed");
    });
  };

  return (
    <div className="ktp-page">
      <div className="ktp-card-form demo-wide ktp-space-y-4">
        <h1 className="ktp-title-sm">Dashboard</h1>
        {user ? (
          <>
            <p className="ktp-text">
              Signed in as <strong>{user.nameFull || user.email || "an anonymous user"}</strong>
            </p>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="ktp-btn-primary demo-danger"
            >
              {isLoggingOut ? "Logging out…" : "Log out"}
            </button>
            {logoutError && <div className="ktp-error">{logoutError}</div>}
            <div className="demo-panel">
              <h2>Backend user (from the session cookie)</h2>
              <pre>{JSON.stringify(user, null, 2)}</pre>
            </div>
            <div className="demo-panel">
              <h2>Firebase user</h2>
              <pre>
                {firebaseUser
                  ? JSON.stringify(firebaseUser.toJSON(), null, 2)
                  : "None: the session was restored from the cookie, so Firebase was never loaded."}
              </pre>
            </div>
          </>
        ) : (
          <p className="ktp-text">Not signed in</p>
        )}
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const { user, isLoading, syncError } = useAuth();
  const {
    auth: { routes },
  } = getAuthConfig();

  if (isLoading) {
    return (
      <div className="ktp-page">
        <div className="ktp-spinner" />
      </div>
    );
  }

  return (
    <div className="ktp-page">
      <div className="ktp-card ktp-space-y-3">
        <h1 className="ktp-title">KTP Login React</h1>
        <p className="ktp-subtitle">The auth screens against a local ktp-gcp-auth backend</p>

        {syncError && <div className="ktp-error">{syncError}</div>}

        {user ? (
          <>
            <p className="ktp-text">Signed in as {user.email || "an anonymous user"}</p>
            <Link to={routes.afterLogin} className="ktp-btn-primary">
              Dashboard
            </Link>
          </>
        ) : (
          <>
            <Link to={routes.login} className="ktp-btn-primary">
              Login page
            </Link>
            <Link to={routes.signup} className="ktp-btn-oauth">
              Signup page
            </Link>
            <Link to={routes.resetPassword} className="ktp-btn-oauth">
              Password reset page
            </Link>
            <Link to={routes.anonymousLogin} className="ktp-btn-oauth">
              Anonymous login
            </Link>
            <div className="ktp-divider">
              <span>Protected route</span>
            </div>
            <Link to={routes.afterLogin} className="ktp-link">
              Open the dashboard while signed out
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const {
    auth: { routes },
  } = getAuthConfig();

  return (
    <>
      <SkinToggle />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/*" element={<AuthRoutes />} />
        <Route element={<ProtectedRoute />}>
          <Route path={routes.afterLogin} element={<Dashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};
