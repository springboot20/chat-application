import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { SocketProvider } from "./context/SocketContext.tsx";
import { Provider } from "react-redux";
import store from "./app/store.ts";
import { checkAndClearStorage } from "./utils/versionCheck.ts";
import { StatusProvider } from "./context/StatusContext.tsx";
import { MessageProvider } from "./context/MessageContext.tsx";
import { HelmetProvider } from "react-helmet-async";
import { TourProvider } from "./context/touring/TourContext.tsx";
import { ConfirmProvider } from "./context/confirm/ConfirmModal.tsx";

checkAndClearStorage();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <BrowserRouter>
      <Provider store={store}>
        <SocketProvider>
          <ConfirmProvider>
            <MessageProvider>
              <StatusProvider>
                <ThemeProvider>
                  <TourProvider>
                    <ToastContainer />
                    <App />
                  </TourProvider>
                </ThemeProvider>
              </StatusProvider>
            </MessageProvider>
          </ConfirmProvider>
        </SocketProvider>
      </Provider>
    </BrowserRouter>
  </HelmetProvider>,
);
