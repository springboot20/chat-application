import { ApiService } from '../../app/services/api.service';

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
    register: builder.mutation<Response, FormData>({
      query: (data) => ({
        url: '/chat-app/auth/users/register',
        body: data,
        method: 'POST',
      }),
    }),

    login: builder.mutation<Response, LoginRequest>({
      query: (data) => ({
        url: '/chat-app/auth/users/login',
        body: data,
        method: 'POST',
      }),
    }),

    logout: builder.mutation<Response, void>({
      query: (data) => ({
        url: '/chat-app/auth/users/logout',
        body: data,
        method: 'POST',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(ApiService.util.resetApiState());
        } catch (error) {
          console.error('Logout failed, cache not cleared', error);
        }
      },
    }),

    getCurrentUser: builder.query<Response, void>({
      query: () => ({
        url: '/chat-app/auth/users/current-user',
        method: 'GET',
      }),
      providesTags: ['Auth'],
    }),

    uploadAvatar: builder.mutation<Response, FormData>({
      query: (data) => ({
        url: '/chat-app/auth/users/upload-avatar',
        body: data,
        method: 'POST',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          dispatch(
            AuthApiSlice.util.updateQueryData('getCurrentUser', undefined, (draft) => {
              // Backend returns: new ApiResponse(200, 'user fetched', { user })
              // So RTK cache shape is: { data: { user: { ... } }, statusCode, message, success }
              if (draft?.data?.user) {
                draft.data.user.avatar = data.data.avatar;
              }
            }),
          );
        } catch (error) {
          console.error('Error updating avatar cache:', error);
        }
      },
      invalidatesTags: ['Auth'],
    }),

    resendEmailVerification: builder.mutation<Response, void>({
      query: () => ({
        url: '/chat-app/auth/users/resend-email-verification',
        method: 'POST',
      }),
    }),

    updateAccount: builder.mutation<Response, { username?: string; about?: string }>({
      query: (data) => ({
        url: '/chat-app/auth/users/update-account',
        body: data,
        method: 'PATCH',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          dispatch(
            AuthApiSlice.util.updateQueryData('getCurrentUser', undefined, (draft) => {
              // Same shape — user is nested at draft.data.user
              if (draft?.data?.user) {
                Object.assign(draft.data.user, data.data);
              }
            }),
          );
        } catch (error) {
          console.error('Error updating account cache:', error);
        }
      },
    }),

    changePassword: builder.mutation<Response, any>({
      query: (data) => ({
        url: '/chat-app/auth/users/change-current-password',
        body: data,
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useUploadAvatarMutation,
  useGetCurrentUserQuery,
  useChangePasswordMutation,
  useResendEmailVerificationMutation,
  useUpdateAccountMutation,
} = AuthApiSlice;