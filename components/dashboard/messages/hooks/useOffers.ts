import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import { useCallback, useRef } from 'react';
import type { ConversationUser, Message } from '../types';
import { formatMessageTime } from '../utils';

interface UseOffersProps {
  wsRef: React.MutableRefObject<WebSocket | null>;
  user: { id: string; role: string } | null | undefined;
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>;
  selectedConversation?: ConversationUser | null;
}

interface CounterOfferPayload {
  type: 'counter_offer';
  offerId: string;
  counterAmount: number;
  receiverId: string;
  text: string;
  sellerId?: string;
  seller_id?: string;
  buyerId?: string;
  buyer_id?: string;
}

export function useOffers({ wsRef, user, setMessages }: UseOffersProps) {
  const locale = useLocale();
  // Track last sent counter offer for error logging
  const lastCounterOfferRef = useRef<{
    offerId: string;
    timestamp: number;
    payload: CounterOfferPayload;
  } | null>(null);

  const sendOffer = useCallback(
    async (
      productId: string,
      offerAmount: number,
      receiverId: string,
      shippingDetails?: {
        shippingAddress?: string;
        zipCode?: string;
        houseNumber?: string;
      },
      text?: string
    ): Promise<void> => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        toast.error(
          locale === 'en'
            ? 'Not connected. Please wait for connection.'
            : 'غير متصل. يرجى الانتظار للاتصال.'
        );
        return;
      }

      if (!user) return;

      const offerPayload = {
        type: 'send_offer',
        productId: productId,
        offerAmount: offerAmount,
        receiverId: receiverId,
        text:
          text ||
          (locale === 'en'
            ? `I'd like to offer ${offerAmount} SAR for this product`
            : `أود تقديم عرض بقيمة ${offerAmount} ريال لهذا المنتج`),
        shippingAddress: shippingDetails?.shippingAddress || null,
        zipCode: shippingDetails?.zipCode || null,
        houseNumber: shippingDetails?.houseNumber || null,
      };

      try {
        wsRef.current.send(JSON.stringify(offerPayload));
      } catch (error) {
        console.error('Error sending offer:', error);
        toast.error(
          locale === 'en' ? 'Failed to send offer' : 'فشل إرسال العرض'
        );
        throw error;
      }
    },
    [user, locale, wsRef]
  );

  const counterOffer = useCallback(
    async (
      offerId: string,
      counterAmount: number,
      receiverId: string,
      text?: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originalOffer?: any
    ): Promise<void> => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        toast.error(
          locale === 'en'
            ? 'Not connected. Please wait for connection.'
            : 'غير متصل. يرجى الانتظار للاتصال.'
        );
        return;
      }

      // Validate offerId exists
      if (!offerId || offerId.trim() === '') {
        toast.error(
          locale === 'en'
            ? 'Invalid offer. Please try again.'
            : 'عرض غير صالح. يرجى المحاولة مرة أخرى.'
        );
        return;
      }

      // Validate counter amount
      if (!counterAmount || counterAmount <= 0) {
        toast.error(
          locale === 'en'
            ? 'Please enter a valid counter offer amount.'
            : 'يرجى إدخال مبلغ عرض مقابل صحيح.'
        );
        return;
      }

      const counterText =
        text ||
        (locale === 'en'
          ? `I can do ${counterAmount} SAR`
          : `يمكنني الموافقة على ${counterAmount} ريال`);

      // Add optimistic update for counter offer
      if (setMessages && originalOffer) {
        const now = new Date().toISOString();
        const tempMessageId = `temp-counter-${Date.now()}-${Math.random()}`;
        const optimisticMessage: Message = {
          id: tempMessageId,
          text: counterText,
          sender: 'me',
          timestamp: formatMessageTime(now, locale),
          rawTimestamp: now, // Store original timestamp for sorting
          senderId: user?.id,
          receiverId: receiverId,
          offerId: offerId,
          productId: originalOffer.productId || originalOffer.product?.id,
          offer: {
            id: offerId,
            offerAmount: originalOffer.offerAmount,
            counterAmount: counterAmount,
            originalPrice: originalOffer.originalPrice,
            status: 'countered',
            productId: originalOffer.productId || originalOffer.product?.id,
            product: originalOffer.product
              ? {
                  id: originalOffer.product.id || originalOffer.productId,
                  title: originalOffer.product.title,
                  image: originalOffer.product.image,
                  images: originalOffer.product.images,
                  price: originalOffer.product.price,
                  originalPrice: originalOffer.product.originalPrice,
                  currency: originalOffer.product.currency,
                  size: originalOffer.product.size,
                  condition: originalOffer.product.condition,
                }
              : undefined,
          },
          messageType: 'offer',
          isDelivered: false,
          isRead: false,
        };

        setMessages(prev => {
          // Check if we already have this counter offer
          const exists = prev.some(
            m =>
              m.offerId === offerId &&
              m.offer?.status === 'countered' &&
              m.offer?.counterAmount === counterAmount
          );
          if (exists) return prev;
          // Add and sort to maintain chronological order (oldest first, newest last)
          const updated = [...prev, optimisticMessage];
          return updated.sort((a, b) => {
            try {
              const timeA = a.rawTimestamp
                ? new Date(a.rawTimestamp).getTime()
                : a.id && !a.id.startsWith('temp-')
                ? parseInt(a.id.substring(0, 8), 16) * 1000
                : Date.now();
              const timeB = b.rawTimestamp
                ? new Date(b.rawTimestamp).getTime()
                : b.id && !b.id.startsWith('temp-')
                ? parseInt(b.id.substring(0, 8), 16) * 1000
                : Date.now();
              if (timeA > 0 && timeB > 0) {
                return timeA - timeB; // Ascending order (oldest first, newest last)
              }
            } catch {}
            return a.id.localeCompare(b.id);
          });
        });
      }

      // Determine if user is seller or buyer
      const isSeller = user?.role === 'seller';
      const isBuyer = user?.role === 'buyer';

      // Ensure offerId is always included in the payload
      // Include sellerId if user is seller, buyerId if user is buyer
      const counterPayload: CounterOfferPayload = {
        type: 'counter_offer',
        offerId: offerId, // Always include offerId
        counterAmount: counterAmount,
        receiverId: receiverId,
        text: counterText,
      };

      // Add sellerId or buyerId based on user role
      if (isSeller && user?.id) {
        counterPayload.sellerId = user.id;
        // Also include seller_id (snake_case) for backend compatibility
        counterPayload.seller_id = user.id;
      } else if (isBuyer && user?.id) {
        counterPayload.buyerId = user.id;
        // Also include buyer_id (snake_case) for backend compatibility
        counterPayload.buyer_id = user.id;
      }

      // Double-check offerId is present before sending
      if (!counterPayload.offerId || counterPayload.offerId.trim() === '') {
        console.error(
          '❌ Error: offerId is missing or empty from counter offer payload',
          {
            offerId: offerId,
            counterAmount: counterAmount,
            receiverId: receiverId,
            originalOffer: originalOffer,
          }
        );
        toast.error(
          locale === 'en'
            ? 'Error: Offer ID is missing. Please try again.'
            : 'خطأ: معرف العرض مفقود. يرجى المحاولة مرة أخرى.'
        );
        return;
      }

      // Store the full payload being sent for error tracking
      lastCounterOfferRef.current = {
        offerId: counterPayload.offerId,
        timestamp: Date.now(),
        payload: { ...counterPayload },
      };

      // Log the payload being sent (always log, not just in development)
      console.log('📤 [COUNTER OFFER] Sending via WebSocket:', {
        timestamp: new Date().toISOString(),
        payload: counterPayload,
        payloadString: JSON.stringify(counterPayload),
        user: {
          id: user?.id,
          role: user?.role,
        },
        originalOffer: {
          id: originalOffer?.id,
          status: originalOffer?.status,
          offerAmount: originalOffer?.offerAmount,
          counterAmount: originalOffer?.counterAmount,
        },
      });

      try {
        wsRef.current.send(JSON.stringify(counterPayload));
        console.log('✅ [COUNTER OFFER] WebSocket message sent successfully');
      } catch (error) {
        console.error('❌ [COUNTER OFFER] Error sending via WebSocket:', {
          error: error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          payload: lastCounterOfferRef.current?.payload,
          websocketState: wsRef.current?.readyState,
          websocketUrl: wsRef.current?.url,
        });
        // Remove optimistic message on error
        if (setMessages) {
          setMessages(prev =>
            prev.filter(msg => !msg.id.startsWith('temp-counter-'))
          );
        }
        toast.error(
          locale === 'en'
            ? 'Failed to send counter offer'
            : 'فشل إرسال العرض المقابل'
        );
        throw error;
      }
    },
    [locale, wsRef, user, setMessages]
  );

  const acceptOffer = useCallback(
    async (
      offerId: string,
      receiverId: string,
      text?: string
    ): Promise<void> => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        toast.error(
          locale === 'en'
            ? 'Not connected. Please wait for connection.'
            : 'غير متصل. يرجى الانتظار للاتصال.'
        );
        return;
      }

      const acceptPayload = {
        type: 'accept_offer',
        offerId: offerId,
        receiverId: receiverId,
        text:
          text ||
          (locale === 'en'
            ? "Deal! Let's proceed with the purchase"
            : 'اتفاق! دعنا نتابع الشراء'),
      };

      try {
        wsRef.current.send(JSON.stringify(acceptPayload));
      } catch (error) {
        console.error('Error accepting offer:', error);
        toast.error(
          locale === 'en' ? 'Failed to accept offer' : 'فشل قبول العرض'
        );
        throw error;
      }
    },
    [locale, wsRef]
  );

  const rejectOffer = useCallback(
    async (
      offerId: string,
      receiverId: string,
      text?: string
    ): Promise<void> => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        toast.error(
          locale === 'en'
            ? 'Not connected. Please wait for connection.'
            : 'غير متصل. يرجى الانتظار للاتصال.'
        );
        return;
      }

      const rejectPayload = {
        type: 'reject_offer',
        offerId: offerId,
        receiverId: receiverId,
        text:
          text ||
          (locale === 'en'
            ? "Sorry, I can't accept this offer"
            : 'عذراً، لا يمكنني قبول هذا العرض'),
      };

      try {
        wsRef.current.send(JSON.stringify(rejectPayload));
      } catch (error) {
        console.error('Error rejecting offer:', error);
        toast.error(
          locale === 'en' ? 'Failed to reject offer' : 'فشل رفض العرض'
        );
        throw error;
      }
    },
    [locale, wsRef]
  );

  return {
    sendOffer,
    counterOffer,
    acceptOffer,
    rejectOffer,
  };
}
