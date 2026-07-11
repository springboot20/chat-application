import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { Mutex } from "async-mutex";

import { RootState } from "../store";
import { refreshAccessTokenIfNeeded } from "../../api/refreshAccessToken";

const env = import.meta.env;

const mutex = new Mutex();

/**
 * Decode JWT expiry
 */
const getJwtExpiry = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ?? null;
  } catch {
    return null;
  }
};

export const isTokenExpiringSoon = (token: string, threshold = 30): boolean => {
  const exp = getJwtExpiry(token);

  if (!exp) return true;

  return exp - Date.now() / 1000 < threshold;
};

const baseQuery = fetchBaseQuery({
  baseUrl:
    env.MODE === "production"
      ? env.VITE_CHAT_APP_BACKEND_URL
      : env.VITE_CHAT_APP_BACKEND_LOCAL_URL,

  credentials: "include",

  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.tokens?.accessToken;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();

  const url = typeof args === "string" ? args : args.url;

  const isRefreshRequest = url.includes("/auth/users/refresh");
  const isLoginRequest = url.includes("/login");
  const isRegisterRequest = url.includes("/register");
  const isLogoutRequest = url.includes("/logout");

  const isPublicRequest =
    isLoginRequest || isRegisterRequest || isRefreshRequest || isLogoutRequest;

  /**
   * -------------------------------------------------
   * PROACTIVE REFRESH
   * -------------------------------------------------
   */
  const accessToken = (api.getState() as RootState).auth.tokens?.accessToken;

  if (!isPublicRequest && accessToken) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();

      try {
        const success = await refreshAccessTokenIfNeeded({
          dispatch: api.dispatch,
          getState: api.getState,
        });

        if (!success) {
          return {
            error: {
              status: 401,
              data: "Session expired",
            },
          };
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
    }
  }

  /**
   * -------------------------------------------------
   * MAIN REQUEST
   * -------------------------------------------------
   */

  let result = await baseQuery(args, api, extraOptions);

  /**
   * -------------------------------------------------
   * REACTIVE REFRESH
   * -------------------------------------------------
   */

  if (result.error?.status === 401 && !isPublicRequest) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();

      try {
        const success = await refreshAccessTokenIfNeeded({
          dispatch: api.dispatch,
          getState: api.getState,
          // extraOptions,
        });

        if (success) {
          result = await baseQuery(args, api, extraOptions);
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();

      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const ApiService = createApi({
  reducerPath: "ApiService",

  baseQuery: baseQueryWithReauth,

  tagTypes: [
    "Auth",
    "Chat",
    "User",
    "Message",
    "StatusFeed",
    "UserStatuses",
    "Contacts",
    "SuggestedFriends",
    "BlockedContacts",
  ],

  endpoints: () => ({}),
});
