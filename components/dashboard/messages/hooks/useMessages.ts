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
    { 
      skip: !conversationId,
      // Refetch when conversationId changes to ensure we get latest messages
      refetchOnMountOrArgChange: true,
    }
  );

  // Reset pagination when conversation changes
  useEffect(() => {
    if (conversationId) {
      setCurrentPage(1);
      // Start with true optimistically - will be updated when data arrives
      // Don't reset if we already have the correct value to avoid flickering
      setHasMoreMessages(prev => {
        if (prev === true) return prev; // Keep true if already set
        return true; // Otherwise set to true
      });
      setIsLoadingMore(false);
      console.log('🔄 [PAGINATION] Conversation changed, resetting to page 1, hasMoreMessages set to true');
      // Note: Don't clear messages here - let the component handle it
      // This prevents unnecessary clearing and allows proper message merging
    } else {
      // If no conversationId, reset state but don't clear messages
      // (component will handle clearing when needed)
      setCurrentPage(1);
      setHasMoreMessages(false);
      setIsLoadingMore(false);
      console.log('🔄 [PAGINATION] No conversationId, hasMoreMessages set to false');
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

      // Log messages API response with full endpoint details
      const endpoint = `/api/chat/conversations/${conversationId}/messages/`;
      const queryParams = `?page=${currentPage}&limit=${MESSAGES_PER_PAGE}`;
      const fullUrl = `${endpoint}${queryParams}`;
      
      console.log('💬 [MESSAGES API] Endpoint:', fullUrl);
      console.log('💬 [MESSAGES API] Request:', {
        method: 'GET',
        endpoint: endpoint,
        queryParams: {
          page: currentPage,
          limit: MESSAGES_PER_PAGE,
        },
        conversationId: conversationId,
      });
      console.log('💬 [MESSAGES API] Response:', {
        timestamp: new Date().toISOString(),
        status: 'success',
        conversationId: conversationId,
        page: currentPage,
        limit: MESSAGES_PER_PAGE,
        messagesCount: messagesArray.length,
        pagination: pagination,
        hasMoreMessages: currentPage < (pagination?.totalPages || 0),
        messages: messagesArray,
        fullResponse: {
          success: true,
          messages: messagesArray,
          pagination: pagination,
        },
      });

      // Update hasMoreMessages based on pagination
      // Strategy: Show button if there are more messages available
      let hasMore = false;
      
      // CRITICAL: Use messagesArray.length (from API) not merged messages count
      const apiMessagesCount = messagesArray.length;
      const isFirstPage = currentPage === 1;
      const gotFullPage = apiMessagesCount >= MESSAGES_PER_PAGE;
      
      // Debug: Log all values before calculation
      console.log('🔍 [PAGINATION DEBUG] Before calculation:', {
        currentPage,
        apiMessagesCount,
        MESSAGES_PER_PAGE,
        isFirstPage,
        gotFullPage,
        pagination: pagination ? {
          totalPages: pagination.totalPages,
          totalItems: pagination.totalItems,
        } : 'no pagination',
      });
      
      if (pagination && typeof pagination.totalPages === 'number' && pagination.totalPages > 0) {
        // If pagination exists and is valid, check if currentPage is less than totalPages
        const hasMoreFromPagination = currentPage < pagination.totalPages;
        
        // Show button if:
        // 1. Pagination says there are more pages (currentPage < totalPages), OR
        // 2. We got 4+ messages from API on page 1 (ALWAYS show on page 1 if we got full page - conservative approach)
        // Note: On page 2+, only show if pagination says there are more pages
        const condition1 = hasMoreFromPagination;
        const condition2 = gotFullPage && isFirstPage;
        hasMore = condition1 || condition2;
        
        console.log('📄 [PAGINATION] hasMoreMessages (from pagination):', {
          currentPage,
          totalPages: pagination.totalPages,
          totalItems: pagination.totalItems,
          apiMessagesReceived: apiMessagesCount,
          hasMoreFromPagination: condition1,
          gotFullPageAndFirstPage: condition2,
          gotFullPage,
          isFirstPage,
          hasMore,
          calculation: `(${currentPage} < ${pagination.totalPages}) = ${condition1} OR (${apiMessagesCount} >= ${MESSAGES_PER_PAGE} && ${currentPage} === 1) = ${condition2} → ${hasMore}`,
          explanation: condition1
            ? `Page ${currentPage} < ${pagination.totalPages} total pages - more pages available`
            : condition2
            ? `Page 1 with ${apiMessagesCount} messages (>= ${MESSAGES_PER_PAGE}) - showing button conservatively`
            : `Page ${currentPage} is last page (${pagination.totalPages}) and not page 1 with full page - no more messages`,
        });
      } else {
        // If no pagination info, use heuristics:
        // - If we got 4+ messages from API, there might be more (show button)
        // - If we got fewer than 4 from API, there are no more messages (hide button)
        hasMore = gotFullPage;
        console.log('📄 [PAGINATION] hasMoreMessages (heuristic - no pagination):', {
          apiMessagesReceived: apiMessagesCount,
          expected: MESSAGES_PER_PAGE,
          gotFullPage,
          hasMore,
          reason: gotFullPage 
            ? `Got ${apiMessagesCount} messages from API (>= ${MESSAGES_PER_PAGE}), might have more` 
            : `Got ${apiMessagesCount} messages from API (< ${MESSAGES_PER_PAGE}), no more messages`,
        });
      }
      
      // Always update hasMoreMessages when we have data
      // Use functional update to ensure we're working with the latest state
      setHasMoreMessages(prev => {
        console.log('✅ [PAGINATION] Updating hasMoreMessages:', {
          previous: prev,
          new: hasMore,
          willChange: prev !== hasMore,
        });
        return hasMore;
      });
      
      // Additional debug: Log the final state
      console.log('✅ [PAGINATION] Final hasMoreMessages state:', hasMore, {
        willShowButton: hasMore,
        apiMessagesCount: apiMessagesCount,
        currentPage,
        paginationExists: !!pagination,
        totalPages: pagination?.totalPages,
        totalItems: pagination?.totalItems,
        messagesArrayLength: messagesArray.length,
      });

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
        // CRITICAL: If prev messages are from a different conversation, clear them first
        // We can detect this by checking if prev has messages but none match the current conversation
        // For now, we'll check if prev is empty or if we're on page 1, we'll replace messages
        // The component should clear messages when switching conversations
        
        // On first page load (page 1), replace messages but preserve optimistic and WebSocket messages
        // On subsequent pages, prepend older messages
        if (currentPage === 1) {
          // Check if we're loading a different conversation by comparing message participants
          // If API messages have different sender/receiver IDs than prev messages, it's a new conversation
          const apiSenderIds = new Set(
            formattedMessages.map(m => m.senderId).filter(Boolean)
          );
          const apiReceiverIds = new Set(
            formattedMessages.map(m => m.receiverId).filter(Boolean)
          );
          const prevSenderIds = new Set(
            prev.map(m => m.senderId).filter(Boolean)
          );
          const prevReceiverIds = new Set(
            prev.map(m => m.receiverId).filter(Boolean)
          );
          
          // If no overlap in participants, it's a different conversation - replace messages
          const hasOverlap = 
            (apiSenderIds.size > 0 && Array.from(apiSenderIds).some(id => prevSenderIds.has(id) || prevReceiverIds.has(id))) ||
            (apiReceiverIds.size > 0 && Array.from(apiReceiverIds).some(id => prevSenderIds.has(id) || prevReceiverIds.has(id)));
          
          // If prev is empty or it's a different conversation, just use API messages
          if (prev.length === 0 || (!hasOverlap && formattedMessages.length > 0)) {
            console.log('🔄 [MESSAGES] Replacing messages - new conversation detected', {
              prevLength: prev.length,
              apiLength: formattedMessages.length,
              hasOverlap,
            });
            return formattedMessages.sort((a, b) => {
              try {
                const timeA = a.rawTimestamp ? new Date(a.rawTimestamp).getTime() : 0;
                const timeB = b.rawTimestamp ? new Date(b.rawTimestamp).getTime() : 0;
                return timeA - timeB;
              } catch {
                return a.id.localeCompare(b.id);
              }
            });
          }
          
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

  // Debug: Log the value being returned
  useEffect(() => {
    console.log('🔔 [PAGINATION] hasMoreMessages value being returned:', hasMoreMessages);
  }, [hasMoreMessages]);

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

