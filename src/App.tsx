import { Navigate, Route, Routes } from 'react-router-dom'
import { ChatLayout } from './layouts/ChatLayout'
import { Login } from './pages/Login'
import { useAuth } from './context/AuthContext'
import { Register } from './pages/Register'
import { Forgot } from './pages/Forgot'
import { Otp } from './pages/Otp'
import { PrivateRoutes } from './routes/PrivateRoute'
import { PublicRoutes } from './routes/PublicRoutes'
import { OtpForm } from './pages/OtpForm'

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
         ww </PrivateRoutes>
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
        path="/otp"
        element={
          <PublicRoutes>
            <Otp />
          </PublicRoutes>
        }
      />
      <Route
        path="/otp2"
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
