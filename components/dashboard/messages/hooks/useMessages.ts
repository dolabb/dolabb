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
        setMessages([]);
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

      setMessages(formattedMessages);
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

