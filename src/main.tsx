import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeContextProvider } from './context/ThemeContext.tsx';
import { SocketContextProvider } from './context/SocketContext.tsx';
import { Provider } from 'react-redux';
import store from './app/store.ts';
import { checkAndClearStorage } from './utils/versionCheck.ts';
import { StatusProvider } from './context/StatusContext.tsx';

checkAndClearStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Provider store={store}>
      <SocketContextProvider>
        <StatusProvider>
          <ThemeContextProvider>
            <ToastContainer />
            <App />
          </ThemeContextProvider>
        </StatusProvider>
      </SocketContextProvider>
    </Provider>
  </BrowserRouter>,
);
