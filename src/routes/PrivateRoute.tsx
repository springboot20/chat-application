import React from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export const PrivateRoutes: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, token } = useAuth();

  if (!user?._id || !token) return <Navigate to="/login" replace />;
  return children;
};
