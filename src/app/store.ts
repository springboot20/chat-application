import { configureStore, combineReducers, type Reducer, type AnyAction } from '@reduxjs/toolkit';
import { ApiService, rtkQueryErrorLogger } from './services/api.service';
import { authReducer, forceLogout } from '../features/auth/auth.reducer';
import { chatReducer } from '../features/chats/chat.reducer';
import statusSlice from '../features/status/status.slice';
import { AuthApiSlice } from '../features/auth/auth.slice';

const appReducer = combineReducers({
  auth: authReducer,
  chat: chatReducer,
  statusStories: statusSlice.reducer,
  [ApiService.reducerPath]: ApiService.reducer,
});

const rootReducer: Reducer = (state: RootState | undefined, action: AnyAction) => {
  if (action.type === forceLogout.type || AuthApiSlice.endpoints.logout.matchFulfilled(action)) {
    // Matches RTK Query mutation success
    state = undefined;
  }
  return appReducer(state, action);
};

const store = configureStore({
  reducer: rootReducer,
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
