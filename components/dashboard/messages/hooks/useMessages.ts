import {
  useGetMessagesQuery,
  type Message as ApiMessage,
} from '@/lib/api/chatApi';
import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import { useEffect } from 'react';
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

  const {
    data: messagesData,
    refetch: refetchMessages,
    isLoading: isLoadingMessages,
    isFetching: isFetchingMessages,
    error: messagesError,
  } = useGetMessagesQuery(
    {
      conversationId: conversationId || '',
      page: 1,
      limit: 50,
    },
    { skip: !conversationId }
  );

  useEffect(() => {
    if (conversationId) {
      const timeoutId = setTimeout(() => {
        refetchMessages()
          .then(result => {
            if (result.error) {
              const errorData = (result.error as any)?.data;
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
              }
            }
          })
          .catch(error => {
            console.error('Refetch error:', error);
            toast.error(
              locale === 'en'
                ? 'Failed to load messages. Please try again.'
                : 'فشل تحميل الرسائل. يرجى المحاولة مرة أخرى.'
            );
          });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [conversationId, refetchMessages, locale]);

  useEffect(() => {
    if (messagesData && user) {
      const messagesArray = messagesData.messages || [];

      if (messagesArray.length === 0) {
        // Don't clear messages if there are optimistic messages
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
          const isOfferMessage = !!(
            (msg.offerId && (msg as any).offer) ||
            ((msg as any).messageType === 'offer' && (msg as any).offer) ||
            ((msg as any).offer &&
              ((msg as any).offer.offerAmount || (msg as any).offer.offer))
          );

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
            offerId: msg.offerId || (msg as any).offer?.id || undefined,
            productId:
              msg.productId ||
              (msg as any).offer?.productId ||
              (msg as any).offer?.product?.id ||
              undefined,
            offer: (msg as any).offer || undefined,
            isDelivered: msg.senderId === user.id ? true : undefined,
            isRead: msg.senderId === user.id ? false : undefined,
          };

          return formattedMessage;
        }
      );

      // Merge with existing messages instead of replacing
      setMessages(prev => {
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
        // We keep them to ensure real-time messages don't disappear
        const websocketMessages = prev.filter(msg => 
          !msg.id.startsWith('temp-') && // Not an optimistic message
          !formattedMessages.some(apiMsg => apiMsg.id === msg.id) && // Not in API response
          msg.id && // Has a real ID (from WebSocket)
          true // Keep all WebSocket messages - they'll be deduplicated by ID
        );
        
        if (process.env.NODE_ENV === 'development' && websocketMessages.length > 0) {
          console.log('📨 Preserving WebSocket messages not in API response:', websocketMessages.length);
        }
        
        // Combine API messages with remaining optimistic and WebSocket messages
        const allMessages = [...formattedMessages, ...optimisticMessages, ...websocketMessages];
        
        // Remove duplicates by ID
        const uniqueMessages = allMessages.reduce((acc, msg) => {
          if (!acc.some(m => m.id === msg.id)) {
            acc.push(msg);
          }
          return acc;
        }, [] as Message[]);
        
        // Sort by rawTimestamp (chronological order - oldest first, newest last)
        return uniqueMessages.sort((a, b) => {
          // Use rawTimestamp if available (ISO string), otherwise try to parse timestamp
          try {
            const timeA = a.rawTimestamp 
              ? new Date(a.rawTimestamp).getTime()
              : (a.id ? parseInt(a.id.substring(0, 8), 16) * 1000 : 0); // Extract timestamp from MongoDB ObjectId
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
          // Fallback: sort by message ID (MongoDB ObjectIds are sortable)
          return a.id.localeCompare(b.id);
        });
      });
    } else if (!messagesData && conversationId && messages.length === 0) {
      // Don't clear messages here - wait for the query to complete
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
  }, [messagesData, user, locale, conversationId, messagesError, messages.length, setMessages]);

  return {
    isLoadingMessages,
    isFetchingMessages,
    messagesError,
    refetchMessages,
  };
}

