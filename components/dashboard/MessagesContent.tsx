'use client';

import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useGetConversationsQuery } from '@/lib/api/chatApi';
import { useAppSelector } from '@/lib/store/hooks';
import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ChatArea from './messages/components/ChatArea';
import ChatHeader from './messages/components/ChatHeader';
import MessageInput from './messages/components/MessageInput';
import UsersList from './messages/components/UsersList';
import { useMessages } from './messages/hooks/useMessages';
import { useOffers } from './messages/hooks/useOffers';
import type { ConversationUser, Message } from './messages/types';
import { formatMessageTime } from './messages/utils';

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

  const [otherUserOnlineStatus, setOtherUserOnlineStatus] =
    useState<boolean>(false);

  // Set up WebSocket message handler for current conversation
  // This will handle real-time message updates when WebSocket is connected
  useEffect(() => {
    if (!conversationId || !wsRef.current) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        // Log all WebSocket messages for debugging
        if (
          data.type === 'offer_countered' ||
          data.type === 'offer_sent' ||
          data.type === 'offer_accepted' ||
          data.type === 'offer_rejected'
        ) {
          console.log('📥 [WEBSOCKET] Received offer message:', {
            timestamp: new Date().toISOString(),
            type: data.type,
            offerId: data.offer?.id,
            conversationId: data.conversationId,
            messageId: data.message?.id,
            rawData: data,
          });
        }

        // Get current conversationId at the time of message processing
        const currentConvId = conversationId;

        // For offer messages, also check if the offer belongs to current user
        // This ensures offer messages are processed even if conversation isn't selected
        const isOfferMessage =
          data.type === 'offer_sent' ||
          data.type === 'offer_countered' ||
          data.type === 'offer_accepted' ||
          data.type === 'offer_rejected';
        const offerBelongsToUser =
          isOfferMessage &&
          data.offer &&
          user?.id &&
          (data.offer.buyerId === user?.id || data.offer.sellerId === user?.id);

        // Only process messages for current conversation (or offer messages that belong to user)
        if (
          data.conversationId !== currentConvId &&
          data.type !== 'online_users' &&
          !offerBelongsToUser
        ) {
          return;
        }

        if (
          data.type === 'chat_message' &&
          data.message &&
          data.conversationId === currentConvId
        ) {
          const isMyMessage =
            data.message.senderId === user?.id ||
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
              const timeA = a.rawTimestamp
                ? new Date(a.rawTimestamp).getTime()
                : 0;
              const timeB = b.rawTimestamp
                ? new Date(b.rawTimestamp).getTime()
                : 0;
              return timeA - timeB;
            });
          });

          // Refetch conversations to update last message
          refetchConversations();
        }

        if (data.type === 'online_users' && selectedConversation) {
          const isOtherUserOnline = data.onlineUsers?.includes(
            selectedConversation.otherUser.id
          );
          setOtherUserOnlineStatus(isOtherUserOnline || false);
        }

        // Handle offer messages - update messages state immediately for instant UI update
        // Process if conversationId matches OR if offer belongs to current user
        const shouldProcessOffer =
          (data.type === 'offer_sent' ||
            data.type === 'offer_countered' ||
            data.type === 'offer_accepted' ||
            data.type === 'offer_rejected') &&
          data.offer &&
          (data.conversationId === currentConvId || offerBelongsToUser);

        if (shouldProcessOffer) {
          console.log('📨 [OFFER MESSAGE] Processing offer message:', {
            timestamp: new Date().toISOString(),
            type: data.type,
            offerId: data.offer?.id,
            conversationId: data.conversationId,
            currentConvId: currentConvId,
            conversationIdMatches: data.conversationId === currentConvId,
            offerBelongsToUser,
            buyerId: data.offer?.buyerId,
            sellerId: data.offer?.sellerId,
            currentUserId: user?.id,
            messageId: data.message?.id,
            senderId: data.message?.senderId,
            receiverId: data.message?.receiverId,
          });

          // Get sender and receiver IDs - prioritize message data from backend
          // Backend should provide senderId and receiverId in the message object
          let messageSenderId: string | undefined;
          let messageReceiverId: string | undefined;

          // First, try to get from message object (most reliable)
          if (data.message?.senderId && data.message?.receiverId) {
            messageSenderId = data.message.senderId;
            messageReceiverId = data.message.receiverId;
          } else {
            // Fallback: determine from offer data based on message type
            if (data.type === 'offer_sent') {
              // Buyer sends initial offer to seller
              messageSenderId = data.offer.buyerId;
              messageReceiverId = data.offer.sellerId;
            } else if (data.type === 'offer_countered') {
              // Counter offer: need to determine who sent it
              // Check if backend provides any indication of who sent the counter
              if (data.message?.senderId) {
                messageSenderId = data.message.senderId;
                messageReceiverId =
                  data.message.senderId === data.offer.sellerId
                    ? data.offer.buyerId
                    : data.offer.sellerId;
              } else {
                // Fallback: use offer's lastCounteredBy or assume seller countered
                // This is a fallback - backend should provide senderId
                messageSenderId =
                  (data.offer as any)?.lastCounteredBy || data.offer.sellerId;
                messageReceiverId =
                  messageSenderId === data.offer.sellerId
                    ? data.offer.buyerId
                    : data.offer.sellerId;
              }
            } else if (
              data.type === 'offer_accepted' ||
              data.type === 'offer_rejected'
            ) {
              // Accept/reject: the one who performs the action is the sender
              if (data.message?.senderId) {
                messageSenderId = data.message.senderId;
                messageReceiverId =
                  data.message.senderId === data.offer.sellerId
                    ? data.offer.buyerId
                    : data.offer.sellerId;
              } else {
                // Fallback: usually seller accepts/rejects buyer's offer
                messageSenderId = data.offer.sellerId;
                messageReceiverId = data.offer.buyerId;
              }
            }
          }

          // Determine if this message is from current user
          // Use backend's isSender field if available (most reliable per-client)
          // Otherwise compare senderId with current user ID
          let isMyMessage = false;
          if (data.message?.isSender !== undefined) {
            // Backend's isSender is the most reliable - it's set per client
            isMyMessage = data.message.isSender;
          } else if (data.message?.sender === 'me') {
            isMyMessage = true;
          } else if (data.message?.sender === 'other') {
            isMyMessage = false;
          } else if (messageSenderId && user?.id) {
            // Fallback: compare senderId with current user ID
            isMyMessage = messageSenderId === user?.id;
          }

          const offerRawTimestamp =
            data.message?.timestamp ||
            data.message?.createdAt ||
            data.offer.updatedAt ||
            data.offer.createdAt;

          // Build offer message object
          // CRITICAL: Set sender based on actual senderId comparison, not just backend's sender field
          // This ensures "me" vs "other" is correct for both sender and receiver
          const finalSender: 'me' | 'other' =
            messageSenderId === user?.id ? 'me' : 'other';

          const offerMessage: Message = {
            id:
              data.message?.id || `${data.type}_${data.offer.id}_${Date.now()}`,
            text: data.message?.text || '',
            sender: finalSender, // Use the correctly determined sender
            senderId: messageSenderId,
            receiverId: messageReceiverId,
            timestamp: formatMessageTime(offerRawTimestamp, locale),
            rawTimestamp: offerRawTimestamp,
            offerId: data.offer.id,
            productId: data.offer.productId || data.offer.product?.id,
            offer: {
              id: data.offer.id,
              offerAmount: data.offer.offerAmount,
              counterAmount: data.offer.counterAmount,
              originalPrice: data.offer.originalPrice,
              status:
                data.offer.status ||
                (data.type === 'offer_accepted'
                  ? 'accepted'
                  : data.type === 'offer_rejected'
                  ? 'rejected'
                  : data.type === 'offer_countered'
                  ? 'countered'
                  : 'pending'),
              productId: data.offer.productId,
              shippingCost: data.offer.shippingCost || data.offer.shipping,
              product: data.offer.product
                ? {
                    id: data.offer.product.id || data.offer.productId,
                    title: data.offer.product.title,
                    image: data.offer.product.image,
                    images: data.offer.product.images,
                    price: data.offer.product.price,
                    originalPrice: data.offer.product.originalPrice,
                    currency: data.offer.product.currency || 'SAR',
                    size: data.offer.product.size,
                    condition: data.offer.product.condition,
                  }
                : undefined,
            },
            messageType: 'offer',
            isDelivered: isMyMessage
              ? data.message?.isDelivered !== undefined
                ? data.message.isDelivered
                : true
              : undefined,
            isRead: isMyMessage
              ? data.message?.isRead !== undefined
                ? data.message.isRead
                : false
              : undefined,
          };

          // Update messages state immediately
          setMessages(prev => {
            // For counter offers, try to replace optimistic messages first
            if (data.type === 'offer_countered' && isMyMessage) {
              // Find and replace optimistic counter offer messages
              const optimisticIndex = prev.findIndex(
                m =>
                  m.id.startsWith('temp-counter-') &&
                  m.offerId === offerMessage.offerId &&
                  m.offer?.counterAmount === offerMessage.offer?.counterAmount
              );

              if (optimisticIndex !== -1) {
                console.log(
                  '✅ [REPLACE] Replacing optimistic counter offer with real message:',
                  {
                    optimisticId: prev[optimisticIndex].id,
                    realId: offerMessage.id,
                    offerId: offerMessage.offerId,
                  }
                );
                const updated = [...prev];
                updated[optimisticIndex] = offerMessage;
                return updated.sort((a, b) => {
                  const timeA = a.rawTimestamp
                    ? new Date(a.rawTimestamp).getTime()
                    : 0;
                  const timeB = b.rawTimestamp
                    ? new Date(b.rawTimestamp).getTime()
                    : 0;
                  return timeA - timeB;
                });
              }
            }

            // For accept/reject, update existing message instead of adding new one
            if (
              data.type === 'offer_accepted' ||
              data.type === 'offer_rejected'
            ) {
              // Search for existing message with same offerId (more flexible search)
              const existingOfferIndex = prev.findIndex(m => {
                // Match by offerId (most reliable)
                if (m.offerId === offerMessage.offerId) return true;
                // Also check if offer object has matching ID
                if (
                  m.offer?.id === offerMessage.offer?.id &&
                  offerMessage.offer?.id
                )
                  return true;
                return false;
              });

              console.log(
                '🔍 [ACCEPT/REJECT] Searching for existing offer message:',
                {
                  type: data.type,
                  offerId: offerMessage.offerId,
                  offerObjectId: offerMessage.offer?.id,
                  existingOfferIndex,
                  totalMessages: prev.length,
                  messagesWithOfferId: prev.filter(
                    m => m.offerId === offerMessage.offerId
                  ).length,
                }
              );

              if (existingOfferIndex !== -1) {
                const existingMessage = prev[existingOfferIndex];
                const newStatus =
                  offerMessage.offer?.status ||
                  (data.type === 'offer_accepted' ? 'accepted' : 'rejected');

                console.log('✅ [UPDATE] Updating existing offer message:', {
                  messageIndex: existingOfferIndex,
                  existingMessageId: existingMessage.id,
                  existingStatus: existingMessage.offer?.status,
                  newStatus: newStatus,
                  statusChanged: existingMessage.offer?.status !== newStatus,
                  existingOffer: existingMessage.offer,
                  newOffer: offerMessage.offer,
                });

                // Create completely new objects to ensure React detects the change
                // This is critical for UI updates - even if status is the same, we need new object references
                const updated = [...prev];

                // Always use the new timestamp from the WebSocket message to ensure React detects change
                const updatedTimestamp =
                  offerMessage.rawTimestamp || new Date().toISOString();
                const updatedFormattedTimestamp =
                  offerMessage.timestamp ||
                  formatMessageTime(updatedTimestamp, locale);

                updated[existingOfferIndex] = {
                  ...existingMessage,
                  sender: finalSender, // Update sender to ensure correctness
                  // Create a completely new offer object to trigger re-render
                  // Even if status is the same, new object reference forces React to re-render
                  offer: existingMessage.offer
                    ? {
                        ...existingMessage.offer,
                        ...offerMessage.offer,
                        status: newStatus,
                        // Ensure product object is also new if it exists
                        product:
                          offerMessage.offer?.product ||
                          existingMessage.offer.product,
                      }
                    : offerMessage.offer,
                  text: offerMessage.text || existingMessage.text,
                  // Always update timestamp to ensure message is seen as updated
                  rawTimestamp: updatedTimestamp,
                  timestamp: updatedFormattedTimestamp,
                };

                console.log(
                  '✅ [UPDATE] Message updated, triggering re-render:',
                  {
                    oldMessageId: existingMessage.id,
                    newMessageId: updated[existingOfferIndex].id,
                    oldStatus: existingMessage.offer?.status,
                    newStatus: updated[existingOfferIndex].offer?.status,
                    offerObjectChanged:
                      existingMessage.offer !==
                      updated[existingOfferIndex].offer,
                  }
                );

                return updated;
              } else {
                console.log(
                  '⚠️ [NOT FOUND] Existing offer message not found, will add as new message'
                );
                // Continue to add as new message below
              }
            }

            // Check if message already exists
            // For accept/reject, allow adding even if original offer message exists (backend sends new message)
            // For counter offers, we allow multiple counter offers with different counterAmounts
            const existingMessageIndex = prev.findIndex(m => {
              // Exact ID match - always a duplicate
              if (m.id === offerMessage.id) {
                console.log(
                  '⚠️ [DUPLICATE] Message already exists by ID:',
                  offerMessage.id
                );
                return true;
              }

              // For accept/reject: backend sends a new message, so allow it even if offerId matches
              // Only block if it's the exact same message ID
              if (
                data.type === 'offer_accepted' ||
                data.type === 'offer_rejected'
              ) {
                // Allow new accept/reject messages - they have new message IDs from backend
                return false;
              }

              // For counter offers: only consider it a duplicate if it's the exact same message (same ID)
              // Allow multiple counter offers with same or different amounts - each gets a new message ID from backend
              if (
                data.type === 'offer_countered' &&
                m.offerId === offerMessage.offerId
              ) {
                // Only duplicate if it's the exact same message ID
                // Different message IDs mean different counter offers, even if counterAmount is the same
                const isDuplicate = m.id === offerMessage.id;
                if (isDuplicate) {
                  console.log(
                    '⚠️ [DUPLICATE] Counter offer already exists (same ID):',
                    {
                      offerId: offerMessage.offerId,
                      counterAmount: offerMessage.offer?.counterAmount,
                      messageId: offerMessage.id,
                    }
                  );
                } else {
                  console.log(
                    '✅ [NEW COUNTER] Different counter offer (different ID or amount):',
                    {
                      offerId: offerMessage.offerId,
                      existingCounterAmount: m.offer?.counterAmount,
                      newCounterAmount: offerMessage.offer?.counterAmount,
                      existingMessageId: m.id,
                      newMessageId: offerMessage.id,
                    }
                  );
                }
                return isDuplicate;
              }
              return false;
            });

            if (existingMessageIndex !== -1) {
              console.log('⚠️ [DUPLICATE] Skipping duplicate message');
              return prev;
            }

            console.log('✅ [NEW MESSAGE] Adding new offer message:', {
              type: data.type,
              messageId: offerMessage.id,
              offerId: offerMessage.offerId,
              counterAmount: offerMessage.offer?.counterAmount,
              status: offerMessage.offer?.status,
            });

            // Add new message and sort chronologically
            const updated = [...prev, offerMessage];
            return updated.sort((a, b) => {
              const timeA = a.rawTimestamp
                ? new Date(a.rawTimestamp).getTime()
                : 0;
              const timeB = b.rawTimestamp
                ? new Date(b.rawTimestamp).getTime()
                : 0;
              return timeA - timeB;
            });
          });

          // Refetch conversations to update last message
          refetchConversations();

          // Show toast notifications for offer acceptance
          if (data.type === 'offer_accepted') {
            if (isMyMessage) {
              // Current user accepted the offer
              toast.success(
                locale === 'en'
                  ? 'Offer accepted! Proceed to checkout'
                  : 'تم قبول العرض! تابع إلى الدفع'
              );
            } else {
              // Current user received the acceptance (other party accepted)
              toast.info(
                locale === 'en'
                  ? 'Offer received - The other party accepted your offer'
                  : 'تم استلام العرض - قبل الطرف الآخر عرضك'
              );
            }
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    // Set up listener when WebSocket opens
    const setupListener = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log(
          '🔌 [WEBSOCKET] Setting up message listener for conversation:',
          conversationId
        );
        wsRef.current.addEventListener('message', handleMessage);
      } else {
        console.log(
          '⚠️ [WEBSOCKET] WebSocket not open, cannot set up listener. State:',
          wsRef.current?.readyState
        );
      }
    };

    // Set up listener immediately if WebSocket is already open
    setupListener();

    // Also set up listener when WebSocket opens (in case it connects later)
    const ws = wsRef.current;
    if (ws) {
      ws.addEventListener('open', () => {
        console.log('🔌 [WEBSOCKET] WebSocket opened, setting up listener');
        setupListener();
      });
    }

    return () => {
      if (ws) {
        console.log('🧹 [WEBSOCKET] Cleaning up message listener');
        ws.removeEventListener('message', handleMessage);
        ws.removeEventListener('open', setupListener);
      }
    };
  }, [
    conversationId,
    wsRef,
    user,
    selectedConversation,
    setMessages,
    refetchConversations,
    refetchMessages,
    locale,
  ]);

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
        lastMessage?:
          | string
          | { text?: string; senderId?: string; isSender?: boolean };
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
        if (
          onlineUsersDetails &&
          onlineUsersDetails.length > 0 &&
          otherUser.id
        ) {
          const onlineUserDetail = onlineUsersDetails.find(
            u => u.id === otherUser.id
          );
          if (onlineUserDetail) {
            // Update username and profileImage from online users details
            otherUser = {
              ...otherUser,
              username: onlineUserDetail.username || otherUser.username,
              profileImage:
                onlineUserDetail.profileImage || otherUser.profileImage,
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
        const lastMessageObj =
          typeof conv.lastMessage === 'object' ? conv.lastMessage : null;
        const isLastMessageFromMe =
          lastMessageObj?.senderId === user?.id ||
          lastMessageObj?.isSender === true;

        // Only show unread count if there are unread messages AND the last message wasn't sent by the user
        // This ensures we only show indicators for received/unseen messages, not sent messages
        const unreadCount = isLastMessageFromMe
          ? '0'
          : conv.unreadCount?.toString() || '0';

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
      if (
        onlineUsersDetails &&
        onlineUsersDetails.length > 0 &&
        conv.otherUser.id
      ) {
        const onlineUserDetail = onlineUsersDetails.find(
          u => u.id === conv.otherUser.id
        );
        if (onlineUserDetail) {
          enhancedOtherUser = {
            ...conv.otherUser,
            username: onlineUserDetail.username || conv.otherUser.username,
            profileImage:
              onlineUserDetail.profileImage || conv.otherUser.profileImage,
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
    if (
      selectedConversation?.id !== conversation.id ||
      conversationId !== convId
    ) {
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
  }, [
    isQueryInitialized,
    conversationsData,
    conversations.length,
    searchParams,
    user,
  ]);

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
