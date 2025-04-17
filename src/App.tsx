import { Route, Routes, Navigate } from "react-router-dom";
import { Chat } from "./pages/Chat";
import { Login } from "./pages/login/Login";
import { Register } from "./pages/signup/Register";
import { Forgot } from "./pages/forgot-password/Forgot";
import { PrivateRoutes } from "./routes/PrivateRoute";
import { PublicRoutes } from "./routes/PublicRoutes";
import { OtpForm } from "./pages/otp-code-form/OtpForm";
import { useAppDispatch } from "./redux/redux.hooks";
import { LocalStorage } from "./utils";
import { authenticationExpires } from "./features/auth/auth.reducer";
import { useEffect } from "react";

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const tokens = LocalStorage.get("tokens");

    if (tokens) {
      dispatch(authenticationExpires(tokens.accessToken));
    }
  }, [dispatch]);

  return (
    <Routes>

<Route path="/" element={<Navigate to="/register" />} />

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
