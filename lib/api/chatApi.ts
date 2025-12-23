import { baseApi } from './baseApi';

export interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    username: string;
    profileImage?: string;
  }>;
  lastMessage?: {
    text: string;
    timestamp: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  attachments?: string[];
  productId?: string;
  offerId?: string;
  createdAt: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query<{ success: boolean; conversations: Conversation[] }, void>({
      query: () => ({
        url: '/api/chat/conversations/',
        method: 'GET',
        timeout: 0, // No timeout for conversations API
      }),
      providesTags: ['Conversation'],
    }),

    getMessages: builder.query<
      { success: boolean; messages: Message[]; pagination: PaginationMeta },
      { conversationId: string; page?: number; limit?: number }
    >({
      query: ({ conversationId, page = 1, limit = 50, ...params }) => ({
        url: `/api/chat/conversations/${conversationId}/messages/`,
        method: 'GET',
        params: {
          page,
          limit,
          ...params,
        },
        timeout: 90000, // 90 seconds timeout for messages (increased for sellers with many messages)
      }),
      providesTags: (result, error, { conversationId }) => [
        { type: 'Message', id: conversationId },
      ],
    }),

    sendMessage: builder.mutation<{ success: boolean; message: Message }, any>({
      query: (data) => ({
        url: '/api/chat/send/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Conversation', 'Message'],
    }),

    uploadChatFile: builder.mutation<{ success: boolean; fileUrl: string }, FormData>({
      query: (formData) => ({
        url: '/api/chat/upload/',
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
    }),

    getUnreadStatus: builder.query<
      { success: boolean; hasUnreadMessages: boolean; totalUnreadCount: number },
      void
    >({
      query: () => ({
        url: '/api/chat/unread-status/',
        method: 'GET',
      }),
      providesTags: ['Conversation'],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useUploadChatFileMutation,
  useGetUnreadStatusQuery,
} = chatApi;

