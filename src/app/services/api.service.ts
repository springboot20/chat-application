import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { isRejectedWithValue } from "@reduxjs/toolkit";
import type { MiddlewareAPI, Middleware } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { LocalStorage } from "../../utils";
import { Token } from "../../types/auth";

const env = import.meta.env;

export const ApiService = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl:
      env.MODE === "production"
        ? env.VITE_CHAT_APP_BACKEND_URL
        : env.VITE_CHAT_APP_BACKEND_LOCAL_URL,
    prepareHeaders: (headers) => {
      const tokens = LocalStorage.get("tokens") as Token;

      if (tokens) {
        headers.set("authorization", `Bearer ${tokens?.accessToken}`);
      }

      return headers;
    },
  }),
  tagTypes: ["Auth", "Chat", "User", "Message"],
  endpoints: () => ({}),
});

// interface ChatAppServiceProps extends Middleware {
//   showSuccessNotification?: boolean;
// }

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
    toast.error(message, { className: "text-sm" });
  }
  return next(action);
};
