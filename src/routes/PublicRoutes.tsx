import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../redux/redux.hooks";
import { RootState } from "../app/store";

export const PublicRoutes: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const { isAuthenticated } = useAppSelector((state: RootState) => state.auth);

  if (isAuthenticated) return <Navigate to="/chat" replace />;
  return children;
});
