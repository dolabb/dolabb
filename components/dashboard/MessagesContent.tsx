'use client';

import { useGetConversationsQuery } from '@/lib/api/chatApi';
import { useAppSelector } from '@/lib/store/hooks';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import ChatArea from './messages/components/ChatArea';
import ChatHeader from './messages/components/ChatHeader';
import MessageInput from './messages/components/MessageInput';
import UsersList from './messages/components/UsersList';
import { useMessages } from './messages/hooks/useMessages';
import { useOffers } from './messages/hooks/useOffers';
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

  // Use global WebSocket context
  const {
    wsRef,
    isConnected: isWebSocketConnected,
    isConnecting,
    onlineUsers,
    onlineUsersDetails,
    connectToConversation,
  } = useWebSocketContext();

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

  const [otherUserOnlineStatus, setOtherUserOnlineStatus] = useState<boolean>(false);

  // Set up WebSocket message handler for current conversation
  // This will handle real-time message updates when WebSocket is connected
  useEffect(() => {
    if (!conversationId || !wsRef.current) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // Get current conversationId at the time of message processing
        const currentConvId = conversationId;
        
        // Only process messages for current conversation
        if (data.conversationId !== currentConvId && data.type !== 'online_users') {
          return;
        }

        if (data.type === 'chat_message' && data.message && data.conversationId === currentConvId) {
          const isMyMessage = data.message.senderId === user?.id || 
                              data.message.isSender === true ||
                              data.message.sender === 'me';

          const newMessage: Message = {
            id: data.message.id,
            text: data.message.text || '',
            sender: data.message.sender || (isMyMessage ? 'me' : 'other'),
            timestamp: data.message.timestamp || data.message.createdAt,
            rawTimestamp: data.message.timestamp || data.message.createdAt,
            attachments: data.message.attachments || [],
            senderId: data.message.senderId,
            receiverId: data.message.receiverId,
            offerId: data.message.offerId,
            productId: data.message.productId,
            messageType: data.message.messageType || 'text',
          };

          setMessages(prev => {
            // Double-check conversationId hasn't changed
            if (conversationId !== currentConvId) {
              return prev; // Don't add message if conversation changed
            }
            
            // Check if message already exists
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage].sort((a, b) => {
              const timeA = a.rawTimestamp ? new Date(a.rawTimestamp).getTime() : 0;
              const timeB = b.rawTimestamp ? new Date(b.rawTimestamp).getTime() : 0;
              return timeA - timeB;
            });
          });

          // Refetch conversations to update last message
          refetchConversations();
        }

        if (data.type === 'online_users' && selectedConversation) {
          const isOtherUserOnline = data.onlineUsers?.includes(selectedConversation.otherUser.id);
          setOtherUserOnlineStatus(isOtherUserOnline || false);
        }

        // Handle offer messages
        if ((data.type === 'offer_sent' || data.type === 'offer_countered' || 
             data.type === 'offer_accepted' || data.type === 'offer_rejected') && 
            data.offer && data.conversationId === currentConvId) {
          // Refetch conversations and messages to get updated offer status
          refetchConversations();
          if (conversationId === currentConvId) {
            refetchMessages();
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    // Only add listener if WebSocket is open
    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.addEventListener('message', handleMessage);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.removeEventListener('message', handleMessage);
      }
    };
  }, [conversationId, wsRef, user, selectedConversation, setMessages, refetchConversations, refetchMessages]);

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
        lastMessage?: string | { text?: string; senderId?: string; isSender?: boolean };
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
        
        // Check if last message was sent by current user
        // Only show unread count for received messages, not sent messages
        const lastMessageObj = typeof conv.lastMessage === 'object' ? conv.lastMessage : null;
        const isLastMessageFromMe = 
          lastMessageObj?.senderId === user?.id || 
          lastMessageObj?.isSender === true;
        
        // Only show unread count if there are unread messages AND the last message wasn't sent by the user
        // This ensures we only show indicators for received/unseen messages, not sent messages
        const unreadCount = isLastMessageFromMe 
          ? '0' 
          : (conv.unreadCount?.toString() || '0');
        
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
          unreadCount: unreadCount,
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
    const convId = conversation.conversationId || conversation.id;
    const isSameConversation =
      selectedConversation?.id === conversation.id &&
      conversationId === convId &&
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN;

    // Clear messages immediately when switching to a different conversation
    if (selectedConversation?.id !== conversation.id || conversationId !== convId) {
      setMessages([]); // Clear messages first
    }

    setSelectedConversation(conversation);
    setShowChat(true);

    // Set conversationId to trigger message loading
    if (convId) {
      const previousConvId = conversationId;
      
      // Set conversationId immediately - this will trigger the query to refetch
      setConversationId(convId);
      
      // Refetch conversations to update unread count when conversation is opened
      // This ensures the unread badge disappears when user opens the conversation
      if (parseInt(conversation.unreadCount || '0') > 0) {
        // Small delay to allow messages to load first, then update conversations
        setTimeout(() => {
          refetchConversations();
        }, 500);
      }
      
      console.log('💬 [CONVERSATION SELECTED] Setting conversationId:', {
        conversationId: convId,
        previousConversationId: previousConvId,
        conversation: conversation,
        timestamp: new Date().toISOString(),
      });
      
      // If same conversation, refetch to get latest messages
      if (previousConvId === convId) {
        setTimeout(() => {
          refetchMessages();
        }, 100);
      }
    }

    // Connect to conversation using global WebSocket if not already connected
    if (!isSameConversation && convId) {
      connectToConversation(convId);
    }
  };

  // Auto-select conversation from query params (e.g., when redirected from counter offer or product page)
  useEffect(() => {
    const buyerId = searchParams.get('buyerId');
    const sellerId = searchParams.get('sellerId');
    
    if (
      (buyerId || sellerId) &&
      !selectedConversation &&
      !hasSelectedFromQueryRef.current &&
      isQueryInitialized &&
      user
    ) {
      const targetUserId = buyerId || sellerId;
      
      // First, try to find existing conversation
      if (conversations.length > 0 && conversationsData) {
        const conversation = conversations.find(
          conv => conv.otherUser.id === targetUserId
        );
        
        if (conversation) {
          hasSelectedFromQueryRef.current = true;
          hasAutoSelectedRef.current = true;
          handleUserSelect(conversation);
          router.replace(`/${locale}/messages`);
          return;
        }
      }
      
      // If no conversation exists, we need to create it via API
      // For now, just refetch conversations - the user can manually start a conversation
      if (targetUserId) {
        hasSelectedFromQueryRef.current = true;
        hasAutoSelectedRef.current = true;
        refetchConversations();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQueryInitialized, conversationsData, conversations.length, searchParams, user]);

  // After conversations are refetched, find and select the newly created conversation
  useEffect(() => {
    const buyerId = searchParams.get('buyerId');
    const sellerId = searchParams.get('sellerId');
    const targetUserId = buyerId || sellerId;
    
    if (
      targetUserId &&
      hasSelectedFromQueryRef.current &&
      !selectedConversation &&
      conversations.length > 0 &&
      conversationsData
    ) {
      const conversation = conversations.find(
        conv => conv.otherUser.id === targetUserId
      );
      
      if (conversation) {
        handleUserSelect(conversation);
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
    setSelectedConversation(null);
    // Don't disconnect WebSocket - keep it connected for notifications
    setConversationId(null);
    setMessages([]);
    // Refetch conversations to update unread counts after closing chat
    refetchConversations();
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
