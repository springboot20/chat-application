import { createSlice } from "@reduxjs/toolkit";
import { InitialState, Token, User } from "../../types/auth";
import { LocalStorage } from "../../utils";
import { AuthApiSlice } from "./auth.slice";

const AuthStorage = {
  get: (key: string) => LocalStorage.get(key),
  set: (key: string, value: any) => LocalStorage.set(key, value),
  clear: () => {
    LocalStorage.set("user", null);
    LocalStorage.set("authentified", false);
    LocalStorage.set("tokens", null);
  },
};

const getInitialState = (): InitialState => ({
  tokens: LocalStorage.get("tokens") as Token,
  user: LocalStorage.get("user") as User,
  isAuthenticated: LocalStorage.get("authentified") as boolean,
});

const initialState: InitialState = getInitialState();

const updateAuthState = (state: InitialState, { tokens, user }: { tokens: Token; user?: User }) => {
  state.tokens = tokens;
  state.user = user || null;
  state.isAuthenticated = true;

  AuthStorage.set("tokens", tokens);
  AuthStorage.set("user", user);
  AuthStorage.set("authentified", state.isAuthenticated);
};

const clearAuthState = (state: InitialState) => {
  state.isAuthenticated = false;
  state.tokens = null;
  state.user = null;

  AuthStorage.clear();
};

const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    /**
     * Register builder casing
     */
    builder.addMatcher(AuthApiSlice.endpoints.register.matchFulfilled, (state, { payload }) => {
      updateAuthState(state, { tokens: null!, user: payload.data.user });
    });

    /**
     * Login builder casing
     */
    builder.addMatcher(AuthApiSlice.endpoints.login.matchFulfilled, (state, { payload }) => {
      console.log(payload);
      updateAuthState(state, { tokens: payload.data.tokens, user: payload.data.user });
    });

    /**
     * Logout builder casing
     */
    builder.addMatcher(AuthApiSlice.endpoints.logout.matchFulfilled, (state) => {
      clearAuthState(state);
    });
  },
});

export const authReducer = AuthSlice.reducer;
// export const {} = AuthSlice.reducer;
