import { useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Chat } from './pages/Chat';
import { Login } from './pages/login/Login';
import { Register } from './pages/signup/Register';
import { Forgot } from './pages/forgot-password/Forgot';
import { PrivateRoute } from './routes/PrivateRoute';
import { PublicRoute } from './routes/PublicRoutes';
import { OtpForm } from './pages/otp-code-form/OtpForm';
import { useDispatch } from 'react-redux';
import { indexDBStorage, DBStorageKeys } from './utils';
import { hydrateChatState } from './features/chats/chat.reducer';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const hydrate = async () => {
      try {
        const chatsEntry = await indexDBStorage.get(DBStorageKeys.Chats, 'all_chats');
        const messagesEntry = await indexDBStorage.get(DBStorageKeys.ChatMessages, 'all_messages');
        const unreadEntry = await indexDBStorage.get(DBStorageKeys.UnreadMessages, 'all_unread');
        const usersEntry = await indexDBStorage.get(DBStorageKeys.Users, 'all_users');

        console.log({ chatsEntry, messagesEntry, unreadEntry, usersEntry });
        dispatch(
          hydrateChatState({
            chats: (chatsEntry as any)?.data || [],
            chatMessages: (messagesEntry as any)?.data || {},
            unreadMessages: (unreadEntry as any)?.data || [],
            users: (usersEntry as any)?.data || [],
          }),
        );
      } catch (error) {
        console.error('Failed to hydrate chat state:', error);
      }
    };

    hydrate();
  }, [dispatch]);

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
