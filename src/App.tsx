import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Chat } from './pages/Chat'
import { Login } from './pages/login/Login'
import { useAuth } from './context/AuthContext'
import { Register } from './pages/signup/Register'
import { Forgot } from './pages/forgot-password/Forgot'
import { PrivateRoutes } from './routes/PrivateRoute'
import { PublicRoutes } from './routes/PublicRoutes'
import { OtpForm } from './pages/otp-code-form/OtpForm'
import { useEffect } from 'react'

function App() {
  const { user, token } = useAuth()

  const navigate = useNavigate();

  useEffect(() => {
    if (token && user?._id) {
      navigate('/chat');
    } else {
      navigate('/login');
    }
  }, [token, user, navigate]);

  return (
    <Routes>
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
  )
}

export default App
