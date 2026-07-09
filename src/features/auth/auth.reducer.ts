import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";

import { InitialState, Token, User } from "../../types/auth";
import { LocalStorage } from "../../utils";
import { AuthApiSlice } from "./auth.slice";

const AuthStorage = {
  get: (key: string) => LocalStorage.get(key),
  set: (key: string, value: unknown) => LocalStorage.set(key, value),

  clear: () => {
    LocalStorage.remove("tokens");
    LocalStorage.remove("user");
    LocalStorage.remove("authenticated");
  },
};

const getInitialState = (): InitialState => ({
  tokens: AuthStorage.get("tokens") as Token,
  user: AuthStorage.get("user") as User,
  isAuthenticated: (AuthStorage.get("authenticated") as boolean) ?? false,
});

const initialState: InitialState = getInitialState();

const persistState = (state: InitialState) => {
  AuthStorage.set("tokens", state.tokens);
  AuthStorage.set("user", state.user);
  AuthStorage.set("authenticated", state.isAuthenticated);
};

const clearState = (state: InitialState) => {
  state.tokens = null;
  state.user = null;
  state.isAuthenticated = false;

  AuthStorage.clear();
};

const AuthSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    authenticationExpires: (state, action: PayloadAction<string>) => {
      try {
        if (!action.payload) {
          state.isAuthenticated = false;
          persistState(state);
          return;
        }

        const decoded = jwtDecode<{ exp: number }>(action.payload);

        state.isAuthenticated = decoded.exp * 1000 > Date.now();

        persistState(state);
      } catch {
        state.isAuthenticated = false;
        persistState(state);
      }
    },

    updateTokens: (state, action: PayloadAction<Token>) => {
      state.tokens = action.payload;
      state.isAuthenticated = true;

      persistState(state);
    },

    forceLogout: (state) => {
      clearState(state);
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      AuthApiSlice.endpoints.register.matchFulfilled,
      (state) => {
        clearState(state);
      },
    );

    builder.addMatcher(
      AuthApiSlice.endpoints.login.matchFulfilled,
      (state, { payload }) => {
        state.tokens = payload.data.tokens;
        state.user = null;
        state.isAuthenticated = true;
        persistState(state);
      },
    );

    builder.addMatcher(
      AuthApiSlice.endpoints.getCurrentUser.matchFulfilled,
      (state, { payload }) => {
        state.user = payload.data.user;
        persistState(state);
      },
    );

    builder.addMatcher(
      AuthApiSlice.endpoints.updateAccount.matchFulfilled,
      (state, { payload }) => {
        if (state.user) {
          Object.assign(state.user, payload.data);
        }
        persistState(state);
      },
    );

    builder.addMatcher(
      AuthApiSlice.endpoints.logout.matchFulfilled,
      (state) => {
        clearState(state);
      },
    );
  },
});

export const authReducer = AuthSlice.reducer;

export const { authenticationExpires, updateTokens, forceLogout } =
  AuthSlice.actions;
