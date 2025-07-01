import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeContextProvider } from "./context/ThemeContext.tsx";
import { SocketContextProvider } from "./context/SocketContext.tsx";
import { Provider } from "react-redux";
import store from "./app/store.ts";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Provider store={store}>
      <SocketContextProvider>
        <ThemeContextProvider>
          <ToastContainer />
          <App />
        </ThemeContextProvider>
      </SocketContextProvider>
    </Provider>
  </BrowserRouter>
);
