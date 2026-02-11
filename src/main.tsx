import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { SocketProvider } from './context/SocketContext.tsx';
import { Provider } from 'react-redux';
import store from './app/store.ts';
import { checkAndClearStorage } from './utils/versionCheck.ts';
import { StatusProvider } from './context/StatusContext.tsx';
import { MessageProvider } from './context/MessageContext.tsx';

checkAndClearStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Provider store={store}>
      <SocketProvider>
        <MessageProvider>
          <StatusProvider>
            <ThemeProvider>
              <ToastContainer />
              <App />
            </ThemeProvider>
          </StatusProvider>
        </MessageProvider>
      </SocketProvider>
    </Provider>
  </BrowserRouter>,
);
