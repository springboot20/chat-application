import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InitialState, Token, User } from '../../types/auth';
import { LocalStorage } from '../../utils';
import { AuthApiSlice } from './auth.slice';
import { jwtDecode } from 'jwt-decode';

const AuthStorage = {
  get: (key: string) => LocalStorage.get(key),
  set: (key: string, value: any) => LocalStorage.set(key, value),
  clear: () => {
    LocalStorage.set('user', null);
    LocalStorage.set('authentified', false);
    LocalStorage.set('tokens', null);
  },
};

const getInitialState = (): InitialState => ({
  tokens: LocalStorage.get('tokens') as Token,
  user: LocalStorage.get('user') as User,
  isAuthenticated: LocalStorage.get('authentified') as boolean,
});

const initialState: InitialState = getInitialState();

const updateAuthState = (
  state: InitialState,
  { tokens, user, isAuthenticated }: { isAuthenticated: boolean; tokens: Token; user?: User },
) => {
  state.tokens = tokens;
  state.user = user || null;
  state.isAuthenticated = isAuthenticated;

  AuthStorage.set('tokens', tokens);
  AuthStorage.set('user', user);
  AuthStorage.set('authentified', state.isAuthenticated);
};

const AuthSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authenticationExpires: (state, action: PayloadAction<string>) => {
      try {
        if (!action.payload) {
          state.isAuthenticated = false;
          return;
        }

        const decodedToken = jwtDecode<{ exp: number }>(action.payload);
        const expirationTime = decodedToken?.exp;

        if (!expirationTime || Date.now() >= expirationTime * 1000) {
          state.isAuthenticated = false;
        } else {
          state.isAuthenticated = true;
        }

        AuthStorage.set('authentified', state.isAuthenticated);
      } catch (error) {
        console.error('Error decoding token:', error);
        state.isAuthenticated = false;
      }
    },

    // Call this after a successful Refresh Token call
    updateTokens: (state, action: PayloadAction<any>) => {
      state.tokens = action.payload;
      state.isAuthenticated = true;
      LocalStorage.set('tokens', action.payload);
    },

    // Manual/Force logout
    forceLogout: (state) => {
      state.tokens = null;
      state.user = null;
      state.isAuthenticated = false;
      LocalStorage.clear();
      // Optional: window.location.href = "/login"; // Hard redirect to clear socket memory
    },
  },
  extraReducers: (builder) => {
    /**
     * Register builder casing
     */
    builder.addMatcher(AuthApiSlice.endpoints.register.matchFulfilled, (state, { payload }) => {
      updateAuthState(state, { tokens: null!, user: payload.data.user, isAuthenticated: false });
    });

    builder.addMatcher(AuthApiSlice.endpoints.login.matchFulfilled, (state, { payload }) => {
      // 1. Update State
      state.tokens = payload.data.tokens;
      state.user = payload.data.user;
      state.isAuthenticated = true;

      // 2. Persist to Storage (ONLY PLACE THIS HAPPENS)
      LocalStorage.set('tokens', payload.data.tokens);
      LocalStorage.set('user', payload.data.user);
      LocalStorage.set('authenticated', true);
    });

    builder.addMatcher(
      AuthApiSlice.endpoints.logout.matchFulfilled, // Clear immediately when user clicks
      (state) => {
        state.tokens = null;
        state.user = null;
        state.isAuthenticated = false;
        LocalStorage.clear();
      },
    );
  },
});

export const authReducer = AuthSlice.reducer;
export const { authenticationExpires, updateTokens, forceLogout } = AuthSlice.actions;
