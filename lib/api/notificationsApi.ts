import { baseApi } from './baseApi';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'offer' | 'message' | 'payment' | 'system';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      { success: boolean; notifications: Notification[]; pagination: PaginationMeta },
      { page?: number; limit?: number; isRead?: boolean }
    >({
      query: (params) => ({
        url: '/api/notifications/',
        method: 'GET',
        params,
      }),
      providesTags: ['Notification'],
    }),

    markNotificationRead: builder.mutation<{ success: boolean; message: string }, string>({
      query: (notificationId) => ({
        url: `/api/notifications/${notificationId}/read/`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),

    markAllNotificationsRead: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/api/notifications/mark-all-read/',
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),

    deleteNotification: builder.mutation<{ success: boolean; message: string }, string>({
      query: (notificationId) => ({
        url: `/api/notifications/${notificationId}/delete/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),

    bulkDeleteNotifications: builder.mutation<
      { success: boolean; message: string },
      { notificationIds: string[] }
    >({
      query: (data) => ({
        url: '/api/notifications/bulk-delete/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useBulkDeleteNotificationsMutation,
} = notificationsApi;

