import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import {
  LoginPage,
  SignupPage,
  PasswordResetPage,
  ProtectedRoute,
  useAuth,
} from "../src";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
          {user ? (
            <div className="space-y-4">
              <p className="text-lg">
                Welcome, <strong>{user.nameFirst || user.email}</strong>!
              </p>
              <div className="bg-gray-100 p-4 rounded">
                <h2 className="font-semibold mb-2">User Info:</h2>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">KTP Login React Demo</h1>
        <p className="text-gray-600 mb-6">
          Test the authentication components locally
        </p>

        <div className="space-y-3">
          {user ? (
            <>
              <p className="text-green-600 mb-4">
                Logged in as {user.email}
              </p>
              <Link
                to="/dashboard"
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Login Page
              </Link>
              <Link
                to="/signup"
                className="block w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Signup Page
              </Link>
              <Link
                to="/reset-password"
                className="block w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Password Reset Page
              </Link>
            </>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="font-semibold mb-2">Test Protected Route:</h2>
          <Link
            to="/dashboard"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Try accessing Dashboard (requires auth)
          </Link>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/reset-password" element={<PasswordResetPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
