'use client';

import { useGetConversationsQuery } from '@/lib/api/chatApi';
import { useAppSelector } from '@/lib/store/hooks';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ChatArea from './messages/components/ChatArea';
import ChatHeader from './messages/components/ChatHeader';
import MessageInput from './messages/components/MessageInput';
import UsersList from './messages/components/UsersList';
import { useMessages } from './messages/hooks/useMessages';
import { useOffers } from './messages/hooks/useOffers';
import { useWebSocket } from './messages/hooks/useWebSocket';
import type { ConversationUser, Message } from './messages/types';

export default function MessagesContent() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const user = useAppSelector(state => state.auth.user);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedConversation, setSelectedConversation] =
    useState<ConversationUser | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const hasAutoSelectedRef = useRef<boolean>(false);
  const hasSelectedFromQueryRef = useRef<boolean>(false);

  // Fetch conversations
  const {
    data: conversationsData,
    refetch: refetchConversations,
    isLoading: isLoadingConversations,
    isFetching: isFetchingConversations,
  } = useGetConversationsQuery();

  // Log conversations API response
  useEffect(() => {
    if (conversationsData) {
      console.log('📋 [CONVERSATIONS API] Response:', {
        timestamp: new Date().toISOString(),
        success: conversationsData.success,
        conversationsCount: conversationsData.conversations?.length || 0,
        conversations: conversationsData.conversations,
        fullResponse: conversationsData,
      });
    }
  }, [conversationsData]);

  // Track if query has been initialized (not loading and not fetching means it's ready)
  const isQueryInitialized =
    !isLoadingConversations && !isFetchingConversations;

  // Use messages hook
  const {
    isLoadingMessages,
    isFetchingMessages,
    messagesError,
    refetchMessages,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore,
  } = useMessages({
    conversationId,
    user,
    setMessages,
    messages,
  });

  // Use WebSocket hook
  const {
    isConnecting,
    isWebSocketConnected,
    otherUserOnlineStatus,
    onlineUsers,
    onlineUsersDetails,
    wsRef,
    initializeConversation,
  } = useWebSocket({
    conversationId,
    selectedConversation,
    setMessages,
    refetchConversations,
    user,
    setConversationId,
    isQueryInitialized,
  });

  // Use offers hook
  const { sendOffer, counterOffer, acceptOffer, rejectOffer } = useOffers({
    wsRef,
    user,
    setMessages,
    selectedConversation,
  });

  // Convert API conversations to local format and group by user (not by product)
  // This prevents multiple conversations with the same user for different products
  const rawConversations =
    conversationsData?.conversations?.map(
      (conv: {
        id?: string;
        conversationId?: string;
        otherUser?: {
          id: string;
          username: string;
          profileImage?: string;
          status?: string;
          isOnline?: boolean;
        };
        participants?: Array<{
          id: string;
          username: string;
          profileImage?: string;
          status?: string;
          isOnline?: boolean;
        }>;
        lastMessage?: string | { text?: string };
        lastMessageAt?: string;
        updatedAt?: string;
        unreadCount?: number | string;
        productId?: string | null;
      }) => {
        // Get other user from conversation data
        let otherUser = conv.otherUser || {
          id:
            conv.participants?.find((p: { id: string }) => p.id !== user?.id)
              ?.id || '',
          username:
            conv.participants?.find(
              (p: { id: string; username?: string }) => p.id !== user?.id
            )?.username || 'Unknown',
          profileImage: conv.participants?.find(
            (p: { id: string; profileImage?: string }) => p.id !== user?.id
          )?.profileImage,
          status: conv.participants?.find(
            (p: { id: string; status?: string }) => p.id !== user?.id
          )?.status,
          isOnline: conv.participants?.find(
            (p: { id: string; isOnline?: boolean }) => p.id !== user?.id
          )?.isOnline,
        };
        
        // Enhance with online user details if available
        if (onlineUsersDetails && onlineUsersDetails.length > 0 && otherUser.id) {
          const onlineUserDetail = onlineUsersDetails.find(u => u.id === otherUser.id);
          if (onlineUserDetail) {
            // Update username and profileImage from online users details
            otherUser = {
              ...otherUser,
              username: onlineUserDetail.username || otherUser.username,
              profileImage: onlineUserDetail.profileImage || otherUser.profileImage,
            };
          }
        }

        const isOnline =
          selectedConversation?.id === conv.id
            ? onlineUsers.includes(otherUser.id) || otherUserOnlineStatus
            : onlineUsers.includes(otherUser.id) ||
              (otherUser.isOnline !== undefined
                ? otherUser.isOnline
                : conv.otherUser?.status === 'active');

        const convId = conv.conversationId || conv.id || '';
        return {
          id: conv.id || conv.conversationId || '',
          conversationId: convId,
          otherUser: {
            ...otherUser,
            status: (otherUser.status || conv.otherUser?.status) as
              | 'active'
              | 'inactive'
              | 'offline'
              | undefined,
            isOnline: isOnline,
          },
          lastMessage:
            typeof conv.lastMessage === 'string'
              ? conv.lastMessage
              : conv.lastMessage?.text || '',
          lastMessageAt: conv.lastMessageAt || conv.updatedAt,
          unreadCount: conv.unreadCount?.toString() || '0',
          productId: conv.productId,
        };
      }
    ) || [];

  // Group conversations by otherUser.id (merge conversations with same user)
  // This prevents multiple conversations with the same user for different products
  // Use the most recent conversation as the main one, but combine unread counts
  const conversationsMap = new Map<
    string,
    ConversationUser & { allConversationIds: string[] }
  >();

  rawConversations.forEach(conv => {
    const userId = conv.otherUser.id;
    if (!userId) return;

    const existing = conversationsMap.get(userId);

    if (!existing) {
      // First conversation with this user
      const convId = conv.conversationId;
      if (convId) {
        conversationsMap.set(userId, {
          ...conv,
          allConversationIds: [convId], // Store all conversation IDs for this user
        });
      }
    } else {
      // Merge with existing conversation
      // Use the most recent conversation (by lastMessageAt) as the main one
      const existingDate = new Date(existing.lastMessageAt || 0).getTime();
      const newDate = new Date(conv.lastMessageAt || 0).getTime();
      const convId = conv.conversationId;

      if (convId) {
        if (newDate > existingDate) {
          // This conversation is more recent, use it as the main one
          conversationsMap.set(userId, {
            ...conv,
            // Combine unread counts from all conversations with this user
            unreadCount: (
              parseInt(existing.unreadCount) + parseInt(conv.unreadCount)
            ).toString(),
            // Keep track of all conversation IDs for this user
            allConversationIds: [...existing.allConversationIds, convId],
          });
        } else {
          // Existing is more recent, just update unread count and add conversationId
          existing.unreadCount = (
            parseInt(existing.unreadCount) + parseInt(conv.unreadCount)
          ).toString();
          if (!existing.allConversationIds.includes(convId)) {
            existing.allConversationIds.push(convId);
          }
        }
      }
    }
  });

  // Convert map to array and sort by lastMessageAt (most recent first)
  const conversations: ConversationUser[] = Array.from(
    conversationsMap.values()
  )
    .map(({ allConversationIds: _allIds, ...conv }) => {
      // Enhance with online user details if available (after grouping)
      let enhancedOtherUser = conv.otherUser;
      if (onlineUsersDetails && onlineUsersDetails.length > 0 && conv.otherUser.id) {
        const onlineUserDetail = onlineUsersDetails.find(u => u.id === conv.otherUser.id);
        if (onlineUserDetail) {
          enhancedOtherUser = {
            ...conv.otherUser,
            username: onlineUserDetail.username || conv.otherUser.username,
            profileImage: onlineUserDetail.profileImage || conv.otherUser.profileImage,
          };
        }
      }
      
      // Remove allConversationIds from final output (stored but not needed in UI)
      // Note: allConversationIds could be used in future to fetch messages from all conversations
      // Ensure required fields are strings
      return {
        ...conv,
        id: conv.id || conv.conversationId || '',
        conversationId: conv.conversationId || conv.id || '',
        otherUser: {
          ...enhancedOtherUser,
          status: enhancedOtherUser.status as
            | 'active'
            | 'inactive'
            | 'offline'
            | undefined,
        },
      };
    })
    .sort((a, b) => {
      const dateA = new Date(a.lastMessageAt || 0).getTime();
      const dateB = new Date(b.lastMessageAt || 0).getTime();
      return dateB - dateA; // Most recent first
    });

  const handleUserSelect = async (conversation: ConversationUser) => {
    const isSameConversation =
      selectedConversation?.id === conversation.id &&
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN;

    if (selectedConversation?.id !== conversation.id) {
      setMessages([]);
    }

    setSelectedConversation(conversation);
    setShowChat(true);

    // Set conversationId immediately from conversation data to trigger message loading
    const convId = conversation.conversationId || conversation.id;
    if (convId) {
      setConversationId(convId);
      console.log('💬 [CONVERSATION SELECTED] Setting conversationId:', {
        conversationId: convId,
        conversation: conversation,
        timestamp: new Date().toISOString(),
      });
    }

    if (!isSameConversation) {
      if (wsRef.current && selectedConversation?.id !== conversation.id) {
        wsRef.current.close(1000, 'Switching conversation');
        wsRef.current = null;
      }

      if (conversation.otherUser.id) {
        await initializeConversation(conversation.otherUser.id);
      }
    }
  };

  // Auto-select conversation from query params (e.g., when redirected from counter offer or product page)
  useEffect(() => {
    const buyerId = searchParams.get('buyerId');
    const sellerId = searchParams.get('sellerId');
    
    if (
      (buyerId || sellerId) &&
      conversations.length > 0 &&
      !selectedConversation &&
      !hasSelectedFromQueryRef.current &&
      conversationsData
    ) {
      // Find conversation by buyerId (for sellers) or sellerId (for buyers)
      const targetUserId = buyerId || sellerId;
      const conversation = conversations.find(
        conv => conv.otherUser.id === targetUserId
      );
      
      if (conversation) {
        hasSelectedFromQueryRef.current = true;
        hasAutoSelectedRef.current = true; // Prevent auto-selecting first conversation
        handleUserSelect(conversation);
        // Remove query params from URL
        router.replace(`/${locale}/messages`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationsData, conversations.length, searchParams]);

  // Auto-select first conversation when conversations are loaded (if no query params)
  useEffect(() => {
    const buyerId = searchParams.get('buyerId');
    if (
      !buyerId &&
      conversations.length > 0 &&
      !selectedConversation &&
      !hasAutoSelectedRef.current &&
      !hasSelectedFromQueryRef.current &&
      conversationsData
    ) {
      const firstConversation = conversations[0];
      hasAutoSelectedRef.current = true;
      handleUserSelect(firstConversation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationsData, conversations.length, searchParams]);

  const handleBackToUsers = () => {
    setShowChat(false);
    if (wsRef.current) {
      wsRef.current.close(1000, 'User left chat');
      wsRef.current = null;
    }
    setConversationId(null);
    setMessages([]);
  };

  const handleMessageSent = () => {
    refetchConversations();
  };

  return (
    <div className='bg-off-white min-h-screen' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='h-screen flex flex-col'>
        <div className='bg-white border-b border-rich-sand/30 flex-shrink-0'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
            <h1 className='text-2xl font-bold text-deep-charcoal'>
              {locale === 'en' ? 'Messages' : 'الرسائل'}
            </h1>
          </div>
        </div>
        <div className='flex-1 flex overflow-hidden'>
          <UsersList
            conversations={conversations}
            selectedConversation={selectedConversation}
            isLoading={isLoadingConversations}
            isWebSocketConnected={isWebSocketConnected}
            onlineUsers={onlineUsers}
            onlineUsersDetails={onlineUsersDetails}
            onSelectConversation={handleUserSelect}
            showChat={showChat}
          />

          <div
            className={`${
              showChat ? 'flex' : 'hidden'
            } md:flex flex-1 flex-col`}
          >
            {selectedConversation ? (
              <>
                <ChatHeader
                  selectedConversation={selectedConversation}
                  isConnecting={isConnecting}
                  isWebSocketConnected={isWebSocketConnected}
                  onlineUsers={onlineUsers}
                  onlineUsersDetails={onlineUsersDetails}
                  otherUserOnlineStatus={otherUserOnlineStatus}
                  onBack={handleBackToUsers}
                />

                <ChatArea
                  loadMoreMessages={loadMoreMessages}
                  hasMoreMessages={hasMoreMessages}
                  isLoadingMore={isLoadingMore}
                  messages={messages}
                  selectedConversation={selectedConversation}
                  isLoading={isLoadingMessages}
                  isFetching={isFetchingMessages}
                  error={messagesError}
                  user={user}
                  onAcceptOffer={acceptOffer}
                  onCounterOffer={counterOffer}
                  onRejectOffer={rejectOffer}
                  sendOffer={sendOffer}
                  onRetry={() => refetchMessages()}
                  conversationId={conversationId}
                />

                <MessageInput
                  selectedConversation={selectedConversation}
                  user={user}
                  wsRef={wsRef}
                  onMessageSent={handleMessageSent}
                  setMessages={setMessages}
                />
              </>
            ) : (
              <div className='flex-1 flex items-center justify-center text-deep-charcoal/60'>
                {locale === 'en'
                  ? 'Select a conversation to start chatting'
                  : 'اختر محادثة لبدء الدردشة'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
