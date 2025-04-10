import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../redux/redux.hooks";
import { RootState } from "../app/store";

export const PrivateRoutes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state: RootState) => state.auth);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
};
