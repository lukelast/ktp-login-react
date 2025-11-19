import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import {
  ProtectedRoute,
  useAuth,
  getAuthConfig,
  AuthRoutes,
} from "../src";

const demoStyles = `
  .ktp-demo-page {
    min-height: 100vh;
    background-color: #f9fafb;
    padding: 2rem;
  }
  .ktp-demo-container {
    max-width: 56rem;
    margin-left: auto;
    margin-right: auto;
  }
  .ktp-demo-card {
    background-color: #ffffff;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    padding: 1.5rem;
  }
  .ktp-demo-title {
    font-size: 1.875rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }
  .ktp-demo-user-info {
    background-color: #f3f4f6;
    padding: 1rem;
    border-radius: 0.375rem;
  }
  .ktp-demo-user-info h2 {
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  .ktp-demo-user-info pre {
    font-size: 0.875rem;
    overflow: auto;
  }
  .ktp-btn-danger {
    background-color: #dc2626;
    color: #ffffff;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
  }
  .ktp-btn-danger:hover {
    background-color: #b91c1c;
  }
  .ktp-btn-blue {
    display: block;
    width: 100%;
    background-color: #2563eb;
    color: #ffffff;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    text-decoration: none;
    text-align: center;
  }
  .ktp-btn-blue:hover {
    background-color: #1d4ed8;
  }
  .ktp-btn-green {
    display: block;
    width: 100%;
    background-color: #16a34a;
    color: #ffffff;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    text-decoration: none;
    text-align: center;
  }
  .ktp-btn-green:hover {
    background-color: #15803d;
  }
  .ktp-btn-gray {
    display: block;
    width: 100%;
    background-color: #4b5563;
    color: #ffffff;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    text-decoration: none;
    text-align: center;
  }
  .ktp-btn-gray:hover {
    background-color: #374151;
  }
  .ktp-demo-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }
  .ktp-demo-section h2 {
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  .ktp-demo-link {
    color: #2563eb;
    text-decoration: underline;
  }
  .ktp-demo-link:hover {
    color: #1e40af;
  }
  .ktp-text-success {
    color: #16a34a;
    margin-bottom: 1rem;
  }
  .ktp-text-lg {
    font-size: 1.125rem;
  }
  .ktp-loading-center {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }
`;

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
      <style>{demoStyles}</style>
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
