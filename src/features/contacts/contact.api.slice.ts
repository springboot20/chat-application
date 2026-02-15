import { ApiService } from '../../app/services/api.service';
import { ChatApiSlice } from '../chats/chat.slice';

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: {
    url: string;
    public_id?: string;
  };
}

export interface Contact {
  _id: string;
  owner: string | User;
  contact: User;
  category?: string;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  success?: boolean;
}

export interface AddContactPayload {
  contactId: string;
  category?: string;
}

type Pagination = {
  total: number;
  itemsPerPage: number;
  totalPages: number;
  hasMore: boolean;
  page: number;
};

export const ContactApiSlice = ApiService.injectEndpoints({
  endpoints(builder) {
    return {
      getMyContacts: builder.query<
        ApiResponse<{ contacts: Contact[]; pagination: Pagination }>,
        { page?: number; limit?: number }
      >({
        query: ({ limit = 12, page = 1 }) => ({
          url: `/chat-app/contacts`,
          params: { page, limit },
        }),
        // Always cache based on the same key so we can merge the results
        serializeQueryArgs: ({ endpointName }) => {
          return endpointName;
        },
        // Merge incoming data with the current cache
        merge: (currentCache, newItems, { arg }) => {
          if (arg.page === 1) {
            // If we are on page 1, replace the cache (useful for refreshes)
            return newItems;
          }
          // Append new contacts to the existing list
          currentCache.data.contacts.push(...newItems.data.contacts);
          // Update pagination metadata to the latest
          currentCache.data.pagination = newItems.data.pagination;
        },
        // Refetch when the page argument changes
        forceRefetch({ currentArg, previousArg }) {
          return currentArg?.page !== previousArg?.page;
        },
        providesTags: ['Contacts'],
      }),

      getSuggestedFriends: builder.query<ApiResponse<User[]>, void>({
        query: () => '/chat-app/contacts/suggestions',
        providesTags: ['SuggestedFriends'],
      }),

      getBlockedContacts: builder.query<ApiResponse<Contact[]>, void>({
        query: () => '/chat-app/contacts/blocked',
        providesTags: ['BlockedContacts'],
      }),

      addToContact: builder.mutation<ApiResponse<Contact>, AddContactPayload>({
        query: (payload) => ({
          url: '/chat-app/contacts/add',
          method: 'POST',
          body: payload,
        }),
        // Optimistic update
        async onQueryStarted(payload, { dispatch, queryFulfilled }) {
          try {
            const { data } = await queryFulfilled;

            // Update contacts list
            dispatch(
              ContactApiSlice.util.updateQueryData('getMyContacts', {}, (draft) => {
                draft.data.contacts.unshift(data.data);
              }),
            );

            dispatch(
              ChatApiSlice.util.updateQueryData('getAvailableUsers', {}, (draft) => {
                draft.data.users = draft.data.users.filter(
                  (user: any) => user?._id !== payload.contactId,
                );
              }),
            );

            // Remove from suggestions
            dispatch(
              ContactApiSlice.util.updateQueryData('getSuggestedFriends', undefined, (draft) => {
                draft.data = draft.data.filter((user) => user._id !== payload.contactId);
              }),
            );
          } catch (error) {
            console.error('Error adding contact:', error);
          }
        },
        invalidatesTags: ['Contacts', 'SuggestedFriends'],
      }),

      toggleBlockContact: builder.mutation<ApiResponse<Contact>, string>({
        query: (contactId) => ({
          url: `/chat-app/contacts/${contactId}/block`,
          method: 'PATCH',
        }),
        // Optimistic update
        async onQueryStarted(contactId, { dispatch, queryFulfilled }) {
          // Optimistically update contacts list
          const patchContacts = dispatch(
            ContactApiSlice.util.updateQueryData('getMyContacts', {}, (draft) => {
              const contact = draft.data.contacts.find((c) => c._id === contactId);
              if (contact) {
                contact.isBlocked = !contact.isBlocked;
              }
            }),
          );

          try {
            await queryFulfilled;
          } catch {
            patchContacts.undo();
          }
        },
        invalidatesTags: ['Contacts', 'BlockedContacts'],
      }),

      deleteContact: builder.mutation<ApiResponse<void>, string>({
        query: (contactId) => ({
          url: `/chat-app/contacts/${contactId}`,
          method: 'DELETE',
        }),
        // Optimistic update
        async onQueryStarted(contactId, { dispatch, queryFulfilled }) {
          const patchResult = dispatch(
            ContactApiSlice.util.updateQueryData('getMyContacts', {}, (draft) => {
              draft.data.contacts = draft.data.contacts.filter(
                (contact) => contact._id !== contactId,
              );
            }),
          );

          try {
            await queryFulfilled;
          } catch {
            patchResult.undo();
          }
        },
        invalidatesTags: ['Contacts'],
      }),
    };
  },
});

export const { useGetMyContactsQuery, useAddToContactMutation } = ContactApiSlice;
