import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../redux/redux.hooks';

// PROTECTED: Only for logged-in users
export const PrivateRoute = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // state={{ from: location }} allows you to redirect them back after they log in
  return isAuthenticated ? <Outlet /> : <Navigate to='/login' state={{ from: location }} replace />;
};
