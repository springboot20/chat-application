import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../redux/redux.hooks";

export const PublicRoute = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return !isAuthenticated ? <Outlet /> : <Navigate to="/chat" replace />;
};