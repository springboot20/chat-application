import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { isRejectedWithValue } from '@reduxjs/toolkit';
import type { MiddlewareAPI, Middleware } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import { RootState } from '../store';
import { LocalStorage } from '../../utils';
import { Token } from '../../types/auth';

const env = import.meta.env;

const baseQuery = fetchBaseQuery({
  baseUrl:
    env.MODE === 'production' ? env.VITE_CHAT_APP_BACKEND_URL : env.VITE_CHAT_APP_BACKEND_LOCAL_URL,
  prepareHeaders: (headers, { getState }) => {
    // Get token from state
    const token = (getState() as RootState).auth?.tokens?.accessToken;

    // If we have a token, set the authorization header
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    return headers;
  },
  credentials: 'include', // Include cookies
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  // GATEKEEPER: Don't even try if we don't have a token (except for login/register)
  const state = api.getState() as RootState;
  const token = state.auth?.tokens?.accessToken;
  const url = typeof args === 'string' ? args : args.url;
  
  // List of public endpoints that don't need a token
  const isPublicAction = url.includes('/login') || url.includes('/register');

  if (!token && !isPublicAction) {
    return { error: { status: 401, data: 'No token available' } };
  }

  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const isRefreshAttempt = url.includes('/auth/users/refresh');
    const isLogoutAttempt = url.includes('/auth/users/logout');

    if (!isRefreshAttempt && !isLogoutAttempt) {
      // Get refresh token from storage safely
      const tokens: Token | null = LocalStorage.get('tokens');

      if (!tokens?.refreshToken) {
        api.dispatch({ type: 'auth/forceLogout' });
        return result;
      }

      const refreshResult: any = await baseQuery(
        {
          url: '/chat-app/auth/users/refresh',
          body: { inComingRefreshToken: tokens.refreshToken },
          method: 'POST',
        },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        api.dispatch({ type: 'auth/updateTokens', payload: refreshResult.data.data.tokens });
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch({ type: 'auth/forceLogout' });
      }
    } else if (isLogoutAttempt) {
      api.dispatch({ type: 'auth/forceLogout' });
    }
  }
  return result;
};

/**
 * Log a warning and show a toast!
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const rtkQueryErrorLogger: Middleware = (_: MiddlewareAPI) => (next) => (action) => {
  // RTK Query uses `createAsyncThunk` from redux-toolkit under the hood, so we're able to utilize these matchers!
  if (isRejectedWithValue(action)) {
    const message = action.payload
      ? (action.payload as { data: any }).data?.message
      : action.error.message;
    toast.error(message, { className: 'text-sm' });
  }
  return next(action);
};

export const ApiService = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'Chat', 'User', 'Message', 'StatusFeed', 'UserStatuses'],
  endpoints: () => ({}),
});
