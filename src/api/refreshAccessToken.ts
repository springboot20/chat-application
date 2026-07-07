import { AppDispatch, RootState } from "../app/store";
import { updateTokens, forceLogout } from "../features/auth/auth.reducer";

const env = import.meta.env;

const baseUrl =
  env.MODE === "production"
    ? env.VITE_CHAT_APP_BACKEND_URL
    : env.VITE_CHAT_APP_BACKEND_LOCAL_URL;

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

interface RefreshAccessTokenOptions {
  dispatch: AppDispatch;
  getState: () => RootState;
}

export const refreshAccessTokenIfNeeded = async ({
  dispatch,
  getState,
}: RefreshAccessTokenOptions): Promise<boolean> => {
  // get token state from redux store
  const tokens = getState().auth.tokens;

  // check if there is access to tokens
  if (!tokens?.accessToken || !tokens.refreshToken) {
    dispatch(forceLogout());
    return false;
  }

  // check for access token validity
  if (!isTokenExpiringSoon(tokens.accessToken)) {
    return true;
  }

  try {
    const response = await fetch(`${baseUrl}/chat-app/auth/users/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inComingRefreshToken: tokens.refreshToken,
      }),
    });

    if (!response.ok) {
      dispatch(forceLogout());
      return false;
    }

    const refreshResponse = await response.json();
    const updatedTokens = refreshResponse?.data?.tokens;

    if (!updatedTokens) {
      dispatch(forceLogout());
      return false;
    }

    dispatch(updateTokens(updatedTokens));

    return true;
  } catch {
    dispatch(forceLogout());
    return false;
  }
};
