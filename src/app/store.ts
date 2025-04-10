import { configureStore } from "@reduxjs/toolkit";
import { ApiService, rtkQueryErrorLogger } from "./services/api.service";
import { authReducer } from "../features/auth/auth.reducer";
import { chatReducer } from "../features/chats/chat.reducer";

const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    [ApiService.reducerPath]: ApiService.reducer,
  },
  middleware: (gMD) =>
    gMD({
      immutableCheck: false, // Disable ImmutableStateInvariantMiddleware
      serializableCheck: false, // Optional: Disable SerializableStateInvariantMiddleware
    }).concat(ApiService.middleware, rtkQueryErrorLogger),
  devTools: true,
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
