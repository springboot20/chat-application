import { ApiService } from '../../app/services/api.service';

interface RegisterRequest {
  [key: string]: any;
}

interface Response {
  data: any;
  statusCode: number;
  message: string;
  success: boolean;
}

interface LoginRequest {
  email: string;
  password: string;
}

export const AuthApiSlice = ApiService.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<Response, RegisterRequest>({
      query: (data) => ({
        url: '/auth/users/register',
        body: data,
        method: 'POST',
      }),
    }),

    login: builder.mutation<Response, LoginRequest>({
      query: (data) => ({
        url: '/auth/users/login',
        body: data,
        method: 'POST',
      }),
    }),

    logout: builder.mutation<Response, void>({
      query: (data) => ({
        url: '/auth/users/logout',
        body: data,
        method: 'POST',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(AuthApiSlice.util.resetApiState());
          dispatch(ApiService.util.resetApiState());
        } catch (error) {
          console.error('Logout failed, cache not cleared', error);
        }
      },
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useLogoutMutation } = AuthApiSlice;
