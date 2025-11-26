'use client';

import { useGetConversationsQuery } from '@/lib/api/chatApi';
import { useAppSelector } from '@/lib/store/hooks';
import { useLocale } from 'next-intl';
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

  const [selectedConversation, setSelectedConversation] =
    useState<ConversationUser | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const hasAutoSelectedRef = useRef<boolean>(false);

  // Fetch conversations
  const {
    data: conversationsData,
    refetch: refetchConversations,
    isLoading: isLoadingConversations,
  } = useGetConversationsQuery();

  // Use messages hook
  const {
    isLoadingMessages,
    isFetchingMessages,
    messagesError,
    refetchMessages,
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
    wsRef,
    initializeConversation,
  } = useWebSocket({
    conversationId,
    selectedConversation,
    setMessages,
    refetchConversations,
    user,
    setConversationId,
  });

  // Use offers hook
  const { sendOffer, counterOffer, acceptOffer, rejectOffer } = useOffers({
    wsRef,
    user,
  });

  // Convert API conversations to local format
  const conversations: ConversationUser[] =
    conversationsData?.conversations?.map((conv: any) => {
      const otherUser = conv.otherUser || {
        id: conv.participants?.find((p: any) => p.id !== user?.id)?.id || '',
        username:
          conv.participants?.find((p: any) => p.id !== user?.id)?.username ||
          'Unknown',
        profileImage: conv.participants?.find((p: any) => p.id !== user?.id)
          ?.profileImage,
        status: conv.participants?.find((p: any) => p.id !== user?.id)?.status,
        isOnline: conv.participants?.find((p: any) => p.id !== user?.id)
          ?.isOnline,
      };

      const isOnline =
        selectedConversation?.id === conv.id
          ? onlineUsers.includes(otherUser.id) || otherUserOnlineStatus
          : onlineUsers.includes(otherUser.id) ||
            (otherUser.isOnline !== undefined
              ? otherUser.isOnline
              : conv.otherUser?.status === 'active');

      return {
        id: conv.id || conv.conversationId,
        conversationId: conv.conversationId || conv.id,
        otherUser: {
          ...otherUser,
          status: otherUser.status || conv.otherUser?.status,
          isOnline: isOnline,
        },
        lastMessage: conv.lastMessage || conv.lastMessage?.text,
        lastMessageAt: conv.lastMessageAt || conv.updatedAt,
        unreadCount: conv.unreadCount?.toString() || '0',
        productId: conv.productId,
      };
    }) || [];

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

  // Auto-select first conversation when conversations are loaded
  useEffect(() => {
    if (
      conversations.length > 0 &&
      !selectedConversation &&
      !hasAutoSelectedRef.current &&
      conversationsData
    ) {
      const firstConversation = conversations[0];
      hasAutoSelectedRef.current = true;
      handleUserSelect(firstConversation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationsData, conversations.length]);

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
                  otherUserOnlineStatus={otherUserOnlineStatus}
                  onBack={handleBackToUsers}
                />

                <ChatArea
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
