import { apiClient } from '@/lib/api/client';
import { useAppSelector } from '@/lib/store/hooks';
import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConversationUser, Message } from '../types';
import { formatMessageTime, formatUsername } from '../utils';

const WS_BASE_URL = 'wss://dolabb-backend-2vsj.onrender.com';

interface UseWebSocketProps {
  conversationId: string | null;
  selectedConversation: ConversationUser | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  refetchConversations: () => void;
  user: any;
  setConversationId?: (id: string | null) => void;
}

export function useWebSocket({
  conversationId,
  selectedConversation,
  setMessages,
  refetchConversations,
  user,
  setConversationId,
}: UseWebSocketProps) {
  const locale = useLocale();
  const token =
    useAppSelector(state => state.auth.token) ||
    (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [otherUserOnlineStatus, setOtherUserOnlineStatus] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  const handleWebSocketMessage = useCallback(
    (data: any) => {
      try {
        switch (data.type) {
          case 'online_users':
            if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
              setOnlineUsers(data.onlineUsers);
              if (selectedConversation?.otherUser.id) {
                const isOtherUserOnline = data.onlineUsers.includes(
                  selectedConversation.otherUser.id
                );
                setOtherUserOnlineStatus(isOtherUserOnline);
              }
            }
            break;

          case 'user_status':
            if (data.user_id && data.status) {
              if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
                setOnlineUsers(data.onlineUsers);
              }
              if (selectedConversation?.otherUser.id === data.user_id) {
                setOtherUserOnlineStatus(data.status === 'online');
                if (data.status === 'online') {
                  toast.info(
                    locale === 'en'
                      ? `${formatUsername(
                          selectedConversation.otherUser.username
                        )} is now online`
                      : `${formatUsername(
                          selectedConversation.otherUser.username
                        )} متصل الآن`
                  );
                }
              }
            }
            break;

          case 'chat_message':
            if (data.message) {
              const isMyMessage =
                data.message.isSender !== undefined
                  ? data.message.isSender
                  : data.message.sender === 'me' ||
                    data.message.senderId === user?.id;

              const isOfferMessage = !!(
                (data.message.offerId && data.message.offer) ||
                (data.message.messageType === 'offer' && data.message.offer) ||
                (data.message.offer &&
                  (data.message.offer.offerAmount || data.message.offer.offer))
              );

              const newMessage: Message = {
                id: data.message.id,
                text: isOfferMessage ? '' : data.message.text,
                sender: isMyMessage ? 'me' : 'other',
                timestamp: formatMessageTime(
                  data.message.timestamp || data.message.createdAt,
                  locale
                ),
                attachments: data.message.attachments || [],
                senderId: data.message.senderId,
                receiverId: data.message.receiverId,
                offerId:
                  data.message.offerId || data.message.offer?.id || undefined,
                productId:
                  data.message.productId ||
                  data.message.offer?.productId ||
                  data.message.offer?.product?.id ||
                  undefined,
                offer: data.message.offer || undefined,
                messageType: data.message.messageType,
                isDelivered: isMyMessage
                  ? data.message.isDelivered !== undefined
                    ? data.message.isDelivered
                    : true
                  : undefined,
                isRead: isMyMessage
                  ? data.message.isRead !== undefined
                    ? data.message.isRead
                    : false
                  : undefined,
              };

              if (isMyMessage) {
                setMessages(prev => {
                  const hasRealMessage = prev.some(
                    msg => msg.id === newMessage.id
                  );
                  if (hasRealMessage) return prev;

                  const now = Date.now();
                  const tempMessages = prev
                    .map((msg, index) => ({ msg, index }))
                    .filter(({ msg }) => {
                      if (!msg.id.startsWith('temp-')) return false;
                      if (
                        msg.senderId !== newMessage.senderId ||
                        msg.sender !== 'me'
                      )
                        return false;

                      const tempTimeMatch = msg.id.match(/^temp-(\d+)-/);
                      if (tempTimeMatch) {
                        const tempTime = parseInt(tempTimeMatch[1]);
                        if (now - tempTime > 10000) return false;
                      }

                      const tempText = (msg.text || '').trim();
                      const realText = (newMessage.text || '').trim();
                      return tempText === realText;
                    });

                  if (tempMessages.length > 0) {
                    const { index } = tempMessages[tempMessages.length - 1];
                    const updated = [...prev];
                    updated[index] = {
                      ...newMessage,
                      isDelivered: true,
                    };
                    return updated;
                  } else {
                    const cleaned = prev.filter(msg => {
                      if (!msg.id.startsWith('temp-')) return true;
                      const tempTimeMatch = msg.id.match(/^temp-(\d+)-/);
                      if (tempTimeMatch) {
                        const tempTime = parseInt(tempTimeMatch[1]);
                        return now - tempTime <= 10000;
                      }
                      return true;
                    });
                    return [...cleaned, newMessage];
                  }
                });
              } else {
                setMessages(prev => {
                  const exists = prev.some(msg => msg.id === newMessage.id);
                  if (!exists) {
                    return [...prev, newMessage];
                  }
                  return prev;
                });
              }

              refetchConversations();
            }
            break;

          case 'offer_sent':
          case 'offer_countered':
          case 'offer_accepted':
          case 'offer_rejected':
            if (data.offer) {
              const offerMessage: Message = {
                id: data.message?.id || `${data.type}_${data.offer.id}`,
                text: data.message?.text || '',
                sender: data.offer.sellerId === user?.id ? 'me' : 'other',
                timestamp: formatMessageTime(
                  data.message?.timestamp || data.offer.updatedAt || data.offer.createdAt,
                  locale
                ),
                offerId: data.offer.id,
                productId: data.offer.productId || data.offer.product?.id,
                offer: {
                  id: data.offer.id,
                  offerAmount: data.offer.offerAmount,
                  counterAmount: data.offer.counterAmount,
                  originalPrice: data.offer.originalPrice,
                  status: data.offer.status || (data.type === 'offer_accepted' ? 'accepted' : data.type === 'offer_rejected' ? 'rejected' : data.type === 'offer_countered' ? 'countered' : 'pending'),
                  productId: data.offer.productId,
                  product: data.offer.product
                    ? {
                        id: data.offer.product.id || data.offer.productId,
                        title: data.offer.product.title,
                        image: data.offer.product.image,
                        images: data.offer.product.images,
                        price: data.offer.product.price,
                        originalPrice: data.offer.product.originalPrice,
                        currency: data.offer.product.currency,
                        size: data.offer.product.size,
                        condition: data.offer.product.condition,
                      }
                    : undefined,
                },
              };

              setMessages(prev => {
                if (prev.some(m => m.id === offerMessage.id)) {
                  return prev;
                }
                return [...prev, offerMessage];
              });
              refetchConversations();

              if (data.type === 'offer_sent') {
                toast.success(
                  locale === 'en'
                    ? `Offer of ${data.offer.offerAmount} SAR sent successfully`
                    : `تم إرسال عرض بقيمة ${data.offer.offerAmount} ريال بنجاح`
                );
              } else if (data.type === 'offer_countered') {
                toast.info(
                  locale === 'en'
                    ? `Counter offer of ${data.offer.counterAmount} SAR received`
                    : `تم استلام عرض مقابل بقيمة ${data.offer.counterAmount} ريال`
                );
              } else if (data.type === 'offer_accepted') {
                toast.success(
                  locale === 'en'
                    ? 'Offer accepted! Proceed to checkout'
                    : 'تم قبول العرض! تابع إلى الدفع'
                );
              } else if (data.type === 'offer_rejected') {
                toast.warning(
                  locale === 'en' ? 'Offer was rejected' : 'تم رفض العرض'
                );
              }
            }
            break;

          case 'error':
            const errorMsg = data.message || data.error;
            if (errorMsg === 'You cannot make an offer on your own product') {
              toast.error(
                locale === 'en'
                  ? 'You cannot make an offer on your own product'
                  : 'لا يمكنك تقديم عرض على منتجك الخاص'
              );
            } else if (errorMsg === 'You cannot purchase your own product') {
              toast.error(
                locale === 'en'
                  ? 'You cannot purchase your own product'
                  : 'لا يمكنك شراء منتجك الخاص'
              );
            } else {
              toast.error(
                errorMsg || (locale === 'en' ? 'An error occurred' : 'حدث خطأ')
              );
            }
            break;

          default:
            console.log('Unknown WebSocket message type:', data.type);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        toast.error(
          locale === 'en' ? 'Error processing message' : 'خطأ في معالجة الرسالة'
        );
      }
    },
    [user, locale, refetchConversations, selectedConversation, setMessages]
  );

  const initializeConversation = useCallback(
    async (receiverId: string) => {
      if (!token || !user) {
        toast.error(
          locale === 'en'
            ? 'Authentication required. Please login again.'
            : 'مطلوب تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.'
        );
        return;
      }

      setIsConnecting(true);

      try {
        const conversationsResponse = await apiClient.get(
          '/api/chat/conversations/',
          { timeout: 0 }
        );
        const conversations = conversationsResponse.data.conversations || [];

        let conversation = conversations.find(
          (conv: any) => conv.otherUser?.id === receiverId
        );

        if (!conversation) {
          try {
            await apiClient.post('/api/chat/send/', {
              receiverId: receiverId,
              text: locale === 'en' ? 'Hello!' : 'مرحبا!',
              productId: null,
              attachments: [],
              offerId: null,
            });

            const newConversationsResponse = await apiClient.get(
              '/api/chat/conversations/',
              { timeout: 0 }
            );
            const newConversations =
              newConversationsResponse.data.conversations || [];
            conversation = newConversations.find(
              (conv: any) => conv.otherUser?.id === receiverId
            );
          } catch (error: any) {
            console.error('Error creating conversation:', error);
            toast.error(
              locale === 'en'
                ? 'Failed to start conversation. Please try again.'
                : 'فشل بدء المحادثة. يرجى المحاولة مرة أخرى.'
            );
            setIsConnecting(false);
            return;
          }
        }

        if (!conversation) {
          toast.error(
            locale === 'en'
              ? 'Could not find or create conversation'
              : 'تعذر العثور على المحادثة أو إنشاؤها'
          );
          setIsConnecting(false);
          return;
        }

        const convId = conversation.conversationId || conversation.id;

        if (
          wsRef.current &&
          wsRef.current.readyState === WebSocket.OPEN &&
          conversationId === convId
        ) {
          setIsConnecting(false);
          setIsWebSocketConnected(true);
          return;
        }

        const connectionState = { isIntentionallyClosed: false };

        if (wsRef.current && conversationId && conversationId !== convId) {
          connectionState.isIntentionallyClosed = true;
          wsRef.current.close(1000, 'Switching conversation');
          wsRef.current = null;
        } else if (wsRef.current) {
          if (wsRef.current.readyState !== WebSocket.OPEN) {
            connectionState.isIntentionallyClosed = true;
            wsRef.current.close();
            wsRef.current = null;
          }
        }

        const wsUrl = `${WS_BASE_URL}/ws/chat/${convId}/?token=${encodeURIComponent(
          token
        )}`;

        const websocket = new WebSocket(wsUrl);

        const connectionTimeout = setTimeout(() => {
          if (websocket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket connection timeout');
            websocket.close();
            setIsConnecting(false);
            toast.error(
              locale === 'en'
                ? 'Connection timeout. Please try again.'
                : 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.'
            );
          }
        }, 10000);

        websocket.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('✅ WebSocket Connected successfully');
          setIsConnecting(false);
          setIsWebSocketConnected(true);
          connectionState.isIntentionallyClosed = false;
        };

        websocket.onmessage = event => {
          try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            toast.error(
              locale === 'en'
                ? 'Error receiving message'
                : 'خطأ في استقبال الرسالة'
            );
          }
        };

        websocket.onerror = error => {
          clearTimeout(connectionTimeout);
          console.error('WebSocket Error:', error);
          setIsConnecting(false);
        };

        websocket.onclose = event => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket closed:', event.code, event.reason);
          setIsConnecting(false);
          setIsWebSocketConnected(false);

          if (connectionState.isIntentionallyClosed) {
            return;
          }

          if (event.code === 4001) {
            toast.error(
              locale === 'en'
                ? 'Authentication failed. Please login again.'
                : 'فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.'
            );
            return;
          }
        };

        wsRef.current = websocket;
        connectionState.isIntentionallyClosed = false;
        
        if (setConversationId) {
          setConversationId(convId);
        }
      } catch (error: any) {
        console.error('Error initializing conversation:', error);
        setIsConnecting(false);
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          (locale === 'en'
            ? 'Failed to initialize chat. Please try again.'
            : 'فشل تهيئة الدردشة. يرجى المحاولة مرة أخرى.');
        toast.error(errorMessage);
      }
    },
    [token, user, locale, conversationId, handleWebSocketMessage]
  );

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return {
    isConnecting,
    isWebSocketConnected,
    otherUserOnlineStatus,
    onlineUsers,
    wsRef,
    initializeConversation,
  };
}

