import { Navigate, Route, Routes } from "react-router-dom";
import { Chat } from "./pages/Chat";
import { Login } from "./pages/login/Login";
import { Register } from "./pages/signup/Register";
import { Forgot } from "./pages/forgot-password/Forgot";
import { PrivateRoutes } from "./routes/PrivateRoute";
import { PublicRoutes } from "./routes/PublicRoutes";
import { OtpForm } from "./pages/otp-code-form/OtpForm";
import { useAppSelector } from "./redux/redux.hooks";
import { RootState } from "./app/store";

function App() {
  const { isAuthenticated } = useAppSelector((state: RootState) => state.auth);

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/chat" /> : <Navigate to="/login" />}
      />

      <Route
        path="/chat"
        element={
          <PrivateRoutes>
            <Chat />
          </PrivateRoutes>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoutes>
            <Login />
          </PublicRoutes>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoutes>
            <Register />
          </PublicRoutes>
        }
      />
      <Route
        path="/forgot"
        element={
          <PublicRoutes>
            <Forgot />
          </PublicRoutes>
        }
      />
      <Route
        path="/verify-otp"
        element={
          <PublicRoutes>
            <OtpForm initialExpiresIn={60} />
          </PublicRoutes>
        }
      />
    </Routes>
  );
}

export default App;
