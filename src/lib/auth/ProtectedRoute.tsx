import React, { ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import { LoginPage } from "../components/LoginPage";

interface ProtectedRouteProps {
  children?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700 font-medium">Signing in...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage redirectTo={location.pathname + location.search} />;
  }

  return children ? <>{children}</> : <Outlet />;
};
