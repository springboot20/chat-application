import { Navigate, Route, Routes } from 'react-router-dom'
import { ChatLayout } from './layouts/ChatLayout'
import { Login } from './pages/login/Login'
import { useAuth } from './context/AuthContext'
import { Register } from './pages/signup/Register'
import { Forgot } from './pages/forgot-password/Forgot'
import { PrivateRoutes } from './routes/PrivateRoute'
import { PublicRoutes } from './routes/PublicRoutes'
import { OtpForm } from './pages/otp-code-form/OtpForm'

function App() {
  const { user, token } = useAuth()

  return (
    <Routes>
      <Route
        path="/"
        element={
          token && user?._id ? (
            <Navigate to="/chat" />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/chat"
        element={
          <PrivateRoutes>
            <ChatLayout />
            ww{' '}
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
            <OtpForm />
          </PublicRoutes>
        }
      />
    </Routes>
  )
}

export default App
