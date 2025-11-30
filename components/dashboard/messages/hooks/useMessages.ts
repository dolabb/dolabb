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
  const MESSAGES_PER_PAGE = 4; // Load 4 messages per page (both initial and load more)

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
      setHasMoreMessages(true); // Start with true, will be updated when data arrives
      setIsLoadingMore(false);
      // Note: Don't clear messages here - let the component handle it
      // This prevents unnecessary clearing and allows proper message merging
    } else {
      // If no conversationId, reset state but don't clear messages
      // (component will handle clearing when needed)
      setCurrentPage(1);
      setHasMoreMessages(false);
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
      // Always prioritize pagination metadata if available
      if (pagination && typeof pagination.totalPages === 'number') {
        // If pagination exists and is valid, check if currentPage is less than totalPages
        const hasMore = currentPage < pagination.totalPages;
        setHasMoreMessages(hasMore);
      } else {
        // If no pagination info, use heuristics:
        // - If we got exactly the requested amount (4), there might be more
        // - If we got fewer than requested, there are no more messages
        const hasMore = messagesArray.length >= MESSAGES_PER_PAGE;
        setHasMoreMessages(hasMore);
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
          // This includes: initial offers, counter offers, accepted offers, rejected offers
          const apiMessage = msg as any;
          
          // Multiple ways to identify offer messages:
          // 1. messageType === 'offer'
          // 2. Has offerId
          // 3. Has offer object (which may contain counterAmount for counter offers)
          const isOfferMessage = 
            apiMessage.messageType === 'offer' ||
            (!!msg.offerId && apiMessage.messageType !== 'text') ||
            !!apiMessage.offer;

          // Extract offer data - ensure we capture all offer fields including counter offers
          let offerData = undefined;
          if (isOfferMessage && (apiMessage.offer || msg.offerId)) {
            const offer = apiMessage.offer || {};
            offerData = {
              id: offer.id || msg.offerId || undefined,
              offerAmount: offer.offerAmount !== undefined && offer.offerAmount !== null ? offer.offerAmount : undefined,
              counterAmount: offer.counterAmount !== undefined && offer.counterAmount !== null ? offer.counterAmount : undefined,
              originalPrice: offer.originalPrice !== undefined && offer.originalPrice !== null ? offer.originalPrice : undefined,
              status: offer.status || 'pending',
              productId: offer.productId || msg.productId || undefined,
              shippingCost: offer.shippingCost !== undefined && offer.shippingCost !== null 
                ? offer.shippingCost 
                : (offer.shipping !== undefined && offer.shipping !== null ? offer.shipping : undefined),
              expirationDate: offer.expirationDate || undefined,
              // Include complete product information
              product: offer.product ? {
                id: offer.product.id || offer.productId || msg.productId,
                title: offer.product.title,
                image: offer.product.image,
                images: offer.product.images || (offer.product.image ? [offer.product.image] : []),
                price: offer.product.price,
                originalPrice: offer.product.originalPrice !== undefined && offer.product.originalPrice !== null
                  ? offer.product.originalPrice
                  : offer.product.price,
                currency: offer.product.currency || 'SAR',
                size: offer.product.size,
                condition: offer.product.condition,
                brand: offer.product.brand,
                category: offer.product.category,
              } : undefined,
            };
            
            // Log in development to help debug offer parsing
            if (process.env.NODE_ENV === 'development' && offerData.counterAmount !== undefined) {
              console.log('📦 [OFFER] Parsed counter offer:', {
                messageId: msg.id,
                offerId: offerData.id,
                offerAmount: offerData.offerAmount,
                counterAmount: offerData.counterAmount,
                status: offerData.status,
              });
            }
          }

          const formattedMessage: Message = {
            id: msg.id,
            // For offer messages, keep the text if it exists (e.g., "Made an offer of $1300")
            // Otherwise use empty string to let ProductMessageCard handle display
            text: isOfferMessage && !msg.text ? '' : msg.text,
            sender: (msg.senderId === user.id ? 'me' : 'other') as
              | 'me'
              | 'other',
            timestamp: formatMessageTime(msg.createdAt, locale),
            rawTimestamp: msg.createdAt, // Store original timestamp for sorting
            attachments: msg.attachments || [],
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            // Set offerId/productId if this is an offer message
            offerId: isOfferMessage ? (
              msg.offerId || 
              apiMessage.offer?.id || 
              offerData?.id || 
              undefined
            ) : undefined,
            productId: isOfferMessage ? (
              msg.productId ||
              apiMessage.offer?.productId ||
              apiMessage.offer?.product?.id ||
              offerData?.productId ||
              undefined
            ) : undefined,
            offer: offerData,
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
          // For page 1, we should prioritize API messages (they are the source of truth)
          // But we need to preserve:
          // 1. Optimistic messages (temp IDs) that haven't been confirmed by API yet
          // 2. WebSocket messages (real IDs) that are newer than what API returned
          // 3. Offer messages that might not be in API response yet
          
          // Get existing message IDs from API (these are the confirmed messages)
          const apiMessageIds = new Set(formattedMessages.map(m => m.id));
          
          // Preserve optimistic messages (temp IDs) that aren't in API response yet
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
          
          // Preserve WebSocket messages that are newer than the newest API message
          // These are messages received via WebSocket that haven't been persisted to DB yet
          const newestApiTimestamp = formattedMessages.length > 0 
            ? Math.max(...formattedMessages.map(m => {
                try {
                  return m.rawTimestamp ? new Date(m.rawTimestamp).getTime() : 0;
                } catch {
                  return 0;
                }
              }))
            : 0;
          
          const websocketMessages = prev.filter(msg => {
            if (msg.id.startsWith('temp-')) return false; // Skip optimistic messages
            if (apiMessageIds.has(msg.id)) return false; // Skip messages already in API response
            
            // Keep messages that are newer than the newest API message
            try {
              const msgTimestamp = msg.rawTimestamp 
                ? new Date(msg.rawTimestamp).getTime()
                : 0;
              return msgTimestamp > newestApiTimestamp;
            } catch {
              return false;
            }
          });
          
          // Preserve offer messages (counter offers, accepted offers, etc.) that might not be in API response yet
          // These are important and should not be removed
          const offerMessages = prev.filter(msg => {
            if (apiMessageIds.has(msg.id)) return false; // Already in API response
            if (msg.id.startsWith('temp-')) return false; // Already handled as optimistic
            
            // Keep offer messages that aren't in API response
            return (msg.offerId || msg.messageType === 'offer');
          });
          
          // Combine: API messages (source of truth) + optimistic + WebSocket + offer messages
          const allMessages = [
            ...formattedMessages, // API messages are the base
            ...optimisticMessages,
            ...websocketMessages,
            ...offerMessages
          ];
          
          // Remove duplicates by ID (API messages take precedence)
          const uniqueMessages = allMessages.reduce((acc, msg) => {
            const existingIndex = acc.findIndex(m => m.id === msg.id);
            if (existingIndex === -1) {
              acc.push(msg);
            } else {
              // If duplicate, prefer API message (from formattedMessages) over others
              const isApiMessage = formattedMessages.some(m => m.id === msg.id);
              if (isApiMessage) {
                acc[existingIndex] = msg; // Replace with API version
              }
            }
            return acc;
          }, [] as Message[]);
          
          // Sort by rawTimestamp (chronological order - oldest first, newest last)
          return uniqueMessages.sort((a, b) => {
            try {
              const timeA = a.rawTimestamp 
                ? new Date(a.rawTimestamp).getTime()
                : (a.id && !a.id.startsWith('temp-') ? parseInt(a.id.substring(0, 8), 16) * 1000 : Date.now());
              const timeB = b.rawTimestamp 
                ? new Date(b.rawTimestamp).getTime()
                : (b.id && !b.id.startsWith('temp-') ? parseInt(b.id.substring(0, 8), 16) * 1000 : Date.now());
              
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

