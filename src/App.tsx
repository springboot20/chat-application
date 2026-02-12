import { Route, Routes, Navigate } from 'react-router-dom';
import { Chat } from './pages/Chat';
import { Login } from './pages/login/Login';
import { Register } from './pages/signup/Register';
import { Forgot } from './pages/forgot-password/Forgot';
import { PrivateRoute } from './routes/PrivateRoute';
import { PublicRoute } from './routes/PublicRoutes';
import { OtpForm } from './pages/otp-code-form/OtpForm';

function App() {
  return (
    <Routes>
      {/* Root Redirect */}
      <Route path='/' element={<Navigate to='/chat' replace />} />

      {/* --- PRIVATE GROUP --- */}
      <Route element={<PrivateRoute />}>
        <Route path='/chat' element={<Chat />} />
      </Route>

      {/* --- PUBLIC GROUP --- */}
      <Route element={<PublicRoute />}>
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/forgot' element={<Forgot />} />
        <Route path='/verify-otp' element={<OtpForm initialExpiresIn={60} />} />
      </Route>

      {/* 404 Catch-all */}
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

export default App;
