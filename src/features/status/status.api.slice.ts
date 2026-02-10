import { ApiService } from '../../app/services/api.service';
import { User } from '../../types/auth';

interface TextContent {
  text: string;
  backgroundColor: string;
  fontFamily?: string;
  type?: string;
}

interface MediaContent {
  url: string;
  public_id?: string;
  localPath?: string;
}

interface Status {
  _id: string;
  postedBy: Pick<User, '_id' | 'username' | 'avatar' | 'email'> | string;
  type: 'image' | 'text' | 'video';
  caption?: string;
  mediaContent?: MediaContent;
  textContent?: TextContent;
  viewedBy: Pick<User, '_id' | 'username' | 'avatar' | 'email'>[] | string[];
  visibleTo: string[];
  viewCount: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

interface StatusGroup {
  _id: string;
  items: Status[];
  lastUpdated: string;
  user: Pick<User, '_id' | 'username' | 'avatar' | 'email'>;
}

interface AddTextStatusPayload {
  text: string;
  backgroundColor: string;
  type?: string;
}

interface ViewStatusResponse {
  statusId: string;
  viewedBy: string;
}

interface Response<T = any> {
  data: T;
  statusCode: number;
  message: string;
  success: boolean;
}

export const StatusStoriesApiSlice = ApiService.injectEndpoints({
  endpoints: (builder) => ({
    addNewMediaStatus: builder.mutation<Response<Status[]>, FormData>({
      query: (data) => {
        return {
          url: '/chat-app/statuses/add-status/media/',
          body: data,
          method: 'POST',
        };
      },

      invalidatesTags: ['StatusFeed', 'UserStatuses'],
    }),

    getStatusFeed: builder.query<Response<StatusGroup[]>, void>({
      query: () => ({
        url: '/chat-app/statuses/feed/',
        method: 'GET',
      }),
      providesTags: ['StatusFeed'],
      // Polling every 30 seconds for real-time updates
      keepUnusedDataFor: 30,
      // Transform response to filter expired statuses client-side
      transformResponse: (response: Response<StatusGroup[]>) => {
        const now = new Date();
        return {
          ...response,
          data: response.data
            .map((group) => ({
              ...group,
              items: group.items.filter((status) => new Date(status.expiresAt) > now),
            }))
            .filter((group) => group.items.length > 0),
        };
      },
    }),

    addNewTextStatus: builder.mutation<Response<Status>, AddTextStatusPayload>({
      query: (data) => {
        return {
          url: '/chat-app/statuses/add-status/text/',
          body: data,
          method: 'POST',
        };
      },
      invalidatesTags: ['StatusFeed', 'UserStatuses'],

      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data: response } = await queryFulfilled;

          dispatch(
            StatusStoriesApiSlice.util.updateQueryData('getStatusFeed', undefined, (draft) => {
              if (draft.data) {
                const userGroup = draft.data.find((group) => group._id === response.data.postedBy);

                if (userGroup) {
                  userGroup.items.unshift(response.data);
                  userGroup.lastUpdated = response.data.createdAt;
                } else {
                  // Create new group if user doesn't have any statuses yet
                  draft.data.unshift({
                    _id: response.data.postedBy as string,
                    items: [response.data],
                    lastUpdated: response.data.createdAt,
                    user:
                      typeof response.data.postedBy === 'object'
                        ? response.data.postedBy
                        : ({} as User),
                  });
                }
              }
            }),
          );
        } catch (error) {
          console.error('Error in optimistic update:', error);
        }
      },
    }),

    getUserStatuses: builder.query<Response<StatusGroup | null>, void>({
      query: () => ({
        url: '/chat-app/statuses/my-status/',
        method: 'GET',
      }),
      providesTags: ['UserStatuses'],
      keepUnusedDataFor: 30,
      // Filter expired statuses
      transformResponse: (response: Response<StatusGroup | null>) => {
        if (!response.data) return response;

        const now = new Date();
        return {
          ...response,
          data: {
            ...response.data,
            items: response.data.items.filter((status) => new Date(status.expiresAt) > now),
          },
        };
      },
    }),

    markStatusAsViewed: builder.mutation<Response<ViewStatusResponse>, string>({
      query: (statusId) => ({
        url: `/chat-app/statuses/${statusId}/view/`,
        method: 'POST',
      }),
      // Optimistic update for viewed status
      async onQueryStarted(statusId, { dispatch, queryFulfilled, getState }) {
        try {
          await queryFulfilled;

          // Update the status feed cache
          dispatch(
            StatusStoriesApiSlice.util.updateQueryData('getStatusFeed', undefined, (draft) => {
              if (draft.data) {
                draft.data.forEach((group) => {
                  const status = group.items.find((s) => s._id === statusId);
                  if (status && Array.isArray(status.viewedBy)) {
                    // Add current user to viewedBy if not already there
                    const currentUserId = (getState() as any).auth?.user?._id;
                    if (
                      currentUserId &&
                      !status.viewedBy.some((id) =>
                        typeof id === 'string' ? id === currentUserId : id._id === currentUserId,
                      )
                    ) {
                      status.viewedBy.push(currentUserId);
                    }
                  }
                });
              }
            }),
          );
        } catch (error) {
          console.error('Error marking status as viewed:', error);
        }
      },
    }),

    deleteStatus: builder.mutation<Response<{ statusId: string }>, string>({
      query: (statusId) => ({
        url: `/chat-app/statuses/${statusId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StatusFeed', 'UserStatuses'],
      // Optimistic delete
      async onQueryStarted(statusId, { dispatch, queryFulfilled }) {
        // Optimistically remove from feed
        const patchFeedResult = dispatch(
          StatusStoriesApiSlice.util.updateQueryData('getStatusFeed', undefined, (draft) => {
            if (draft.data) {
              draft.data = draft.data
                .map((group) => ({
                  ...group,
                  items: group.items.filter((status) => status._id !== statusId),
                }))
                .filter((group) => group.items.length > 0);
            }
          }),
        );

        // Optimistically remove from user statuses
        const patchUserResult = dispatch(
          StatusStoriesApiSlice.util.updateQueryData('getUserStatuses', undefined, (draft) => {
            if (draft.data) {
              draft.data.items = draft.data.items.filter((status) => status._id !== statusId);
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          // Revert optimistic updates on error
          patchFeedResult.undo();
          patchUserResult.undo();
        }
      },
    }),
  }),
});

export const {
  // Mutations
  useAddNewMediaStatusMutation,
  useAddNewTextStatusMutation,
  useMarkStatusAsViewedMutation,
  useDeleteStatusMutation,

  // Queries
  useGetStatusFeedQuery,
  useGetUserStatusesQuery,
} = StatusStoriesApiSlice;

/**
 * Custom hook for status feed with auto-refetch
 */
export const useStatusFeedWithPolling = (pollingInterval = 30000) => {
  return useGetStatusFeedQuery(undefined, {
    pollingInterval, // Refetch every 30 seconds
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
};

/**
 * Custom hook for user statuses with auto-refetch
 */
export const useUserStatusesWithPolling = (pollingInterval = 30000) => {
  return useGetUserStatusesQuery(undefined, {
    pollingInterval,
    refetchOnMountOrArgChange: true,
  });
};

/**
 * Hook to check if user has active statuses
 */
export const useHasActiveStatuses = () => {
  const { data, isLoading } = useGetUserStatusesQuery();

  return {
    hasActiveStatuses: !!data?.data?.items && data.data.items.length > 0,
    count: data?.data?.items?.length || 0,
    isLoading,
  };
};

/**
 * Hook to get unviewed statuses count
 */
export const useUnviewedStatusCount = (currentUserId: string) => {
  const { data, isLoading } = useGetStatusFeedQuery();

  const unviewedCount =
    data?.data?.reduce((count, group) => {
      if (group._id === currentUserId) return count;

      const unviewedInGroup = group.items.filter((status) => {
        if (Array.isArray(status.viewedBy)) {
          return !status.viewedBy.some((viewer) =>
            typeof viewer === 'string' ? viewer === currentUserId : viewer._id === currentUserId,
          );
        }
        return true;
      }).length;

      return count + (unviewedInGroup > 0 ? 1 : 0);
    }, 0) || 0;

  return { unviewedCount, isLoading };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if a status has been viewed by current user
 */
export const hasViewedStatus = (status: Status, userId: string): boolean => {
  if (!Array.isArray(status.viewedBy)) return false;

  return status.viewedBy.some((viewer) =>
    typeof viewer === 'string' ? viewer === userId : viewer._id === userId,
  );
};

/**
 * Get time remaining for status expiration
 */
export const getTimeRemaining = (expiresAt: string): string => {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

/**
 * Check if status is expired
 */
export const isStatusExpired = (expiresAt: string): boolean => {
  return new Date(expiresAt) < new Date();
};

export type {
  Status,
  StatusGroup,
  User,
  TextContent,
  MediaContent,
  Response,
  AddTextStatusPayload,
  ViewStatusResponse,
};
