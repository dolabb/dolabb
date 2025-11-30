import {
  useGetMessagesQuery,
  type Message as ApiMessage,
} from '@/lib/api/chatApi';
import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import { useEffect, useState, useCallback } from 'react';
import type { Message } from '../types';
import { formatMessageTime } from '../utils';

interface UseMessagesProps {
  conversationId: string | null;
  user: any;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  messages: Message[];
}

export function useMessages({
  conversationId,
  user,
  setMessages,
  messages,
}: UseMessagesProps) {
  const locale = useLocale();
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const MESSAGES_PER_PAGE = 4;

  const {
    data: messagesData,
    refetch: refetchMessages,
    isLoading: isLoadingMessages,
    isFetching: isFetchingMessages,
    error: messagesError,
  } = useGetMessagesQuery(
    {
      conversationId: conversationId || '',
      page: currentPage,
      limit: MESSAGES_PER_PAGE,
    },
    { skip: !conversationId }
  );

  // Reset pagination when conversation changes
  useEffect(() => {
    if (conversationId) {
      setCurrentPage(1);
      setHasMoreMessages(true);
      setIsLoadingMore(false);
    }
  }, [conversationId]);

  // Function to load more messages (previous messages)
  const loadMoreMessages = useCallback(() => {
    if (!conversationId || isLoadingMore || !hasMoreMessages || isLoadingMessages) {
      return;
    }

    setIsLoadingMore(true);
    // Increment page - this will trigger the query to refetch with new page number
    setCurrentPage(prev => prev + 1);
    // Note: isLoadingMore will be set to false when messagesData updates in the useEffect
  }, [conversationId, isLoadingMore, hasMoreMessages, isLoadingMessages]);

  useEffect(() => {
    if (messagesData && user) {
      const messagesArray = messagesData.messages || [];
      const pagination = messagesData.pagination;

      // Update hasMoreMessages based on pagination
      if (pagination) {
        setHasMoreMessages(currentPage < pagination.totalPages);
      } else {
        // If no pagination info, check if we got fewer messages than requested
        setHasMoreMessages(messagesArray.length === MESSAGES_PER_PAGE);
      }

      // Reset loading state when data arrives
      setIsLoadingMore(false);

      if (messagesArray.length === 0 && currentPage === 1) {
        // Only clear messages on first page load if there are no messages
        setMessages(prev => {
          const hasOptimisticMessages = prev.some(msg => msg.id.startsWith('temp-'));
          if (hasOptimisticMessages) {
            // Keep optimistic messages, just return current state
            return prev;
          }
          return [];
        });
        return;
      }

      const formattedMessages: Message[] = messagesArray.map(
        (msg: ApiMessage) => {
          // Check if message is an offer message using messageType from backend
          // Backend sets messageType to "offer" for all offer-related messages
          // Explicitly check that messageType is NOT 'text' to avoid false positives
          const apiMessage = msg as any;
          const isOfferMessage = 
            apiMessage.messageType === 'offer' ||
            (!!msg.offerId && apiMessage.messageType !== 'text');

          const formattedMessage: Message = {
            id: msg.id,
            text: isOfferMessage ? '' : msg.text,
            sender: (msg.senderId === user.id ? 'me' : 'other') as
              | 'me'
              | 'other',
            timestamp: formatMessageTime(msg.createdAt, locale),
            rawTimestamp: msg.createdAt, // Store original timestamp for sorting
            attachments: msg.attachments || [],
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            // Only set offerId/productId if this is actually an offer message
            offerId: isOfferMessage ? (msg.offerId || apiMessage.offer?.id || undefined) : undefined,
            productId: isOfferMessage ? (
              msg.productId ||
              apiMessage.offer?.productId ||
              apiMessage.offer?.product?.id ||
              undefined
            ) : undefined,
            offer: (apiMessage.offer && isOfferMessage) ? {
              id: apiMessage.offer.id,
              offerAmount: apiMessage.offer.offerAmount,
              counterAmount: apiMessage.offer.counterAmount,
              originalPrice: apiMessage.offer.originalPrice,
              status: apiMessage.offer.status,
              productId: apiMessage.offer.productId,
              shippingCost: apiMessage.offer.shippingCost || apiMessage.offer.shipping,
              product: apiMessage.offer.product ? {
                id: apiMessage.offer.product.id || apiMessage.offer.productId,
                title: apiMessage.offer.product.title,
                image: apiMessage.offer.product.image,
                images: apiMessage.offer.product.images,
                price: apiMessage.offer.product.price,
                originalPrice: apiMessage.offer.product.originalPrice,
                currency: apiMessage.offer.product.currency || 'SAR',
                size: apiMessage.offer.product.size,
                condition: apiMessage.offer.product.condition,
              } : undefined,
            } : undefined,
            messageType: apiMessage.messageType || (isOfferMessage ? 'offer' : undefined),
            isDelivered: msg.senderId === user.id ? true : undefined,
            isRead: msg.senderId === user.id ? false : undefined,
          };

          return formattedMessage;
        }
      );

      // Merge with existing messages instead of replacing
      setMessages(prev => {
        // On first page load (page 1), replace messages but preserve optimistic and WebSocket messages
        // On subsequent pages, prepend older messages
        if (currentPage === 1) {
          // Get optimistic messages (temp IDs) that aren't in the API response yet
          const optimisticMessages = prev.filter(msg => 
            msg.id.startsWith('temp-') && 
            !formattedMessages.some(apiMsg => {
              // Check if optimistic message matches any API message by text and sender
              const tempText = (msg.text || '').trim();
              const apiText = (apiMsg.text || '').trim();
              return tempText === apiText && 
                     msg.senderId === apiMsg.senderId &&
                     msg.sender === apiMsg.sender;
            })
          );
          
          // Get WebSocket messages (real IDs) that aren't in the API response yet
          // These are messages received via WebSocket that haven't been persisted to DB yet
          // IMPORTANT: Also preserve offer messages (counter offers, etc.) that might not be in API yet
          const websocketMessages = prev.filter(msg => 
            !msg.id.startsWith('temp-') && // Not an optimistic message
            !formattedMessages.some(apiMsg => apiMsg.id === msg.id) && // Not in API response
            msg.id && // Has a real ID (from WebSocket)
            true
          );
          
          // Also preserve offer messages (counter offers, accepted offers, etc.) that might not be in API response yet
          // These are important and should not be removed
          const offerMessages = prev.filter(msg => 
            (msg.offerId || msg.messageType === 'offer') && // Is an offer message
            !formattedMessages.some(apiMsg => 
              apiMsg.id === msg.id || 
              (apiMsg.offerId === msg.offerId && apiMsg.offer?.status === msg.offer?.status)
            ) && // Not in API response with same offerId and status
            true
          );
          
          // For page 1, we need to be careful:
          // - API returns the 4 newest messages
          // - We might already have more messages displayed (from WebSocket, optimistic, or previous loads)
          // - We should only add NEW messages from API, not re-add existing ones
          
          // Get existing message IDs (excluding temp messages that might be replaced)
          const existingRealMessageIds = new Set(
            prev
              .filter(m => !m.id.startsWith('temp-'))
              .map(m => m.id)
          );
          
          // Filter API messages to only include new ones or ones that replace temp messages
          const newApiMessages = formattedMessages.filter(apiMsg => {
            // If this message ID already exists (and it's not a temp message), skip it
            if (existingRealMessageIds.has(apiMsg.id)) {
              return false; // Already displayed, skip
            }
            return true; // New message or will replace a temp message
          });
          
          // Combine new API messages with optimistic, WebSocket, and offer messages
          // This ensures counter offers and other offer messages don't disappear
          const allMessages = [...newApiMessages, ...optimisticMessages, ...websocketMessages, ...offerMessages];
          
          // Remove duplicates by ID
          const uniqueMessages = allMessages.reduce((acc, msg) => {
            if (!acc.some(m => m.id === msg.id)) {
              acc.push(msg);
            }
            return acc;
          }, [] as Message[]);
          
          // Merge with existing messages:
          // 1. Keep existing real messages that aren't in the new API response
          // 2. Replace temp messages if they match new API messages
          // 3. Add new messages from API
          // IMPORTANT: Preserve offer messages (counter offers, etc.) even if not in API response
          const finalMessages = [
            ...prev.filter(m => {
              // Remove temp messages that are being replaced
              if (m.id.startsWith('temp-')) {
                // For temp counter offers, check if they're being replaced by real message
                if (m.id.startsWith('temp-counter-')) {
                  const isBeingReplaced = newApiMessages.some(apiMsg => 
                    apiMsg.offerId === m.offerId && 
                    apiMsg.offer?.status === 'countered' &&
                    apiMsg.offer?.counterAmount === m.offer?.counterAmount
                  );
                  return !isBeingReplaced; // Keep if not being replaced
                }
                // For other temp messages, check by text content
                const isBeingReplaced = newApiMessages.some(apiMsg => {
                  const tempText = (m.text || '').trim().toLowerCase();
                  const apiText = (apiMsg.text || '').trim().toLowerCase();
                  return tempText === apiText && 
                         m.senderId === apiMsg.senderId &&
                         m.sender === apiMsg.sender;
                });
                return !isBeingReplaced; // Keep if not being replaced
              }
              
              // Always preserve offer messages (counter offers, accepted offers, etc.)
              // These are important and might not be in API response yet
              if (m.offerId || m.messageType === 'offer') {
                // Check if this exact offer message is already in new API messages
                const existsInApi = newApiMessages.some(apiMsg => 
                  apiMsg.id === m.id || 
                  (apiMsg.offerId === m.offerId && 
                   apiMsg.offer?.status === m.offer?.status &&
                   (m.offer?.counterAmount !== undefined 
                     ? apiMsg.offer?.counterAmount === m.offer?.counterAmount
                     : true))
                );
                // Keep if not in API response (it's a real-time message that hasn't been persisted yet)
                return !existsInApi;
              }
              
              // Keep real messages that aren't in the new API response
              // (they might be newer messages not yet in page 1, or older messages from previous loads)
              return !newApiMessages.some(apiMsg => apiMsg.id === m.id);
            }),
            ...uniqueMessages
          ];
          
          // Sort by rawTimestamp (chronological order - oldest first, newest last)
          // IMPORTANT: Sort finalMessages, not uniqueMessages, to include all preserved messages
          return finalMessages.sort((a, b) => {
            try {
              const timeA = a.rawTimestamp 
                ? new Date(a.rawTimestamp).getTime()
                : (a.id ? parseInt(a.id.substring(0, 8), 16) * 1000 : 0);
              const timeB = b.rawTimestamp 
                ? new Date(b.rawTimestamp).getTime()
                : (b.id ? parseInt(b.id.substring(0, 8), 16) * 1000 : 0);
              
              if (timeA > 0 && timeB > 0) {
                return timeA - timeB; // Ascending order (oldest first, newest last)
              }
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('Error sorting messages by timestamp:', error);
              }
            }
            return a.id.localeCompare(b.id);
          });
        } else {
          // Loading more (older) messages - prepend them
          // Backend returns messages in DESC order (newest first), so we need to reverse
          // to get oldest first before prepending
          const reversedFormattedMessages = [...formattedMessages].reverse();
          
          // Get existing messages that aren't in the new API response
          const existingMessages = prev.filter(msg => 
            !formattedMessages.some(apiMsg => apiMsg.id === msg.id)
          );
          
          // Prepend older messages (reversed) to existing ones
          // This ensures chronological order: oldest -> newest
          const allMessages = [...reversedFormattedMessages, ...existingMessages];
          
          // Remove duplicates by ID
          const uniqueMessages = allMessages.reduce((acc, msg) => {
            if (!acc.some(m => m.id === msg.id)) {
              acc.push(msg);
            }
            return acc;
          }, [] as Message[]);
          
          // Sort by rawTimestamp (chronological order - oldest first, newest last)
          // This ensures correct order even if timestamps are slightly off
          return uniqueMessages.sort((a, b) => {
            try {
              const timeA = a.rawTimestamp 
                ? new Date(a.rawTimestamp).getTime()
                : (a.id ? parseInt(a.id.substring(0, 8), 16) * 1000 : 0);
              const timeB = b.rawTimestamp 
                ? new Date(b.rawTimestamp).getTime()
                : (b.id ? parseInt(b.id.substring(0, 8), 16) * 1000 : 0);
              
              if (timeA > 0 && timeB > 0) {
                return timeA - timeB; // Ascending order (oldest first)
              }
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('Error sorting messages by timestamp:', error);
              }
            }
            return a.id.localeCompare(b.id);
          });
        }
      });
    } else if (!messagesData && conversationId && currentPage === 1) {
      // Don't clear messages here - wait for the query to complete
      // Only clear if we have no data and no messages exist (handled by the empty check above)
    }

    if (messagesError) {
      const errorData = (messagesError as any)?.data;
      const errorStatus = (messagesError as any)?.status;

      if (
        errorData === 'timeout of 30000ms exceeded' ||
        errorData === 'timeout of 60000ms exceeded' ||
        errorData === 'timeout of 90000ms exceeded' ||
        (typeof errorData === 'string' && errorData.includes('timeout'))
      ) {
        toast.error(
          locale === 'en'
            ? 'Request timed out. The server is taking too long to respond. Please try again.'
            : 'انتهت مهلة الطلب. الخادم يستغرق وقتاً طويلاً للرد. يرجى المحاولة مرة أخرى.'
        );
      } else if (errorStatus === 401 || errorStatus === 403) {
        toast.error(
          locale === 'en'
            ? 'Authentication error. Please refresh the page and try again.'
            : 'خطأ في المصادقة. يرجى تحديث الصفحة والمحاولة مرة أخرى.'
        );
      } else if (errorStatus !== 404 && (errorData || errorStatus)) {
        toast.error(
          locale === 'en'
            ? 'Failed to load messages. Please try again.'
            : 'فشل تحميل الرسائل. يرجى المحاولة مرة أخرى.'
        );
      }
    }
  }, [messagesData, user, locale, conversationId, messagesError, setMessages, currentPage]);

  return {
    isLoadingMessages,
    isFetchingMessages,
    messagesError,
    refetchMessages,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore,
  };
}

