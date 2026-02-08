import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { isRejectedWithValue } from '@reduxjs/toolkit';
import type { MiddlewareAPI, Middleware } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import { RootState } from '../store';

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
  let result = await baseQuery(args, api, extraOptions);

  // If 401 Unauthorized, try to refresh token
  if (result.error && result.error.status === 401) {
    api.dispatch(ApiService.util.resetApiState());

    // Try to get a new token
    const refreshResult = await baseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions,
    );

    if (refreshResult.data) {
      // Store the new token
      api.dispatch({ type: 'auth/setToken', payload: refreshResult.data });

      // Retry the original query
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed, logout user
      api.dispatch({ type: 'auth/logout' });
    }
  }

  return result;
};

export const ApiService = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'Chat', 'User', 'Message', 'StatusFeed', 'UserStatuses'],
  endpoints: () => ({}),
});

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
