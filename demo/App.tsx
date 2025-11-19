import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import {
  ProtectedRoute,
  useAuth,
  getAuthConfig,
  AuthRoutes,
} from "../src";

import "./demoStyles.css";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="ktp-demo-page">
      <div className="ktp-demo-container">
        <div className="ktp-demo-card">
          <h1 className="ktp-demo-title">Dashboard</h1>
          {user ? (
            <div className="ktp-space-y-4">
              <p className="ktp-text-lg">
                Welcome, <strong>{user.nameFirst || user.email}</strong>!
              </p>
              <div className="ktp-demo-user-info">
                <h2>User Info:</h2>
                <pre>
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              <button
                onClick={logout}
                className="ktp-btn-danger"
              >
                Log Out
              </button>
            </div>
          ) : (
            <p>Not logged in</p>
          )}
        </div>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { auth: { routes } } = getAuthConfig();

  if (isLoading) {
    return (
      <div className="ktp-loading-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="ktp-page">
      <div className="ktp-card-form" style={{ textAlign: 'center' }}>
        <h1 className="ktp-demo-title">KTP Login React Demo</h1>
        <p className="ktp-text" style={{ marginBottom: '1.5rem' }}>
          Test the authentication components locally
        </p>

        <div className="ktp-space-y-3">
          {user ? (
            <>
              <p className="ktp-text-success">
                Logged in as {user.email}
              </p>
              <Link
                to={routes.afterLogin}
                className="ktp-btn-blue"
              >
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to={routes.login}
                className="ktp-btn-blue"
              >
                Login Page
              </Link>
              <Link
                to={routes.signup}
                className="ktp-btn-green"
              >
                Signup Page
              </Link>
              <Link
                to={routes.resetPassword}
                className="ktp-btn-gray"
              >
                Password Reset Page
              </Link>
            </>
          )}
        </div>

        <div className="ktp-demo-section">
          <h2>Test Protected Route:</h2>
          <Link
            to={routes.afterLogin}
            className="ktp-demo-link"
          >
            Try accessing Dashboard (requires auth)
          </Link>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const { auth: { routes } } = getAuthConfig();

  return (
    <>

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
