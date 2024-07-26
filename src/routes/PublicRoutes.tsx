import React from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export const PublicRoutes: React.FC<{ children: React.ReactNode }> = React.memo(
  ({ children }) => {
    const { user, token } = useAuth();

    if (user?._id && token) return <Navigate to="/chat" replace />;
    return children;
  }
);
