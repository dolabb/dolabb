import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import { useCallback } from 'react';
import type { ConversationUser, Message } from '../types';
import { formatMessageTime } from '../utils';

interface UseOffersProps {
  wsRef: React.MutableRefObject<WebSocket | null>;
  user: any;
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>;
  selectedConversation?: ConversationUser | null;
}

export function useOffers({ wsRef, user, setMessages, selectedConversation }: UseOffersProps) {
  const locale = useLocale();

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

      const counterText = text ||
        (locale === 'en'
          ? `I can do ${counterAmount} SAR`
          : `يمكنني الموافقة على ${counterAmount} ريال`);

      // Add optimistic update for counter offer
      if (setMessages && originalOffer) {
        const tempMessageId = `temp-counter-${Date.now()}-${Math.random()}`;
        const optimisticMessage: Message = {
          id: tempMessageId,
          text: counterText,
          sender: 'me',
          timestamp: formatMessageTime(new Date().toISOString(), locale),
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
            product: originalOffer.product ? {
              id: originalOffer.product.id || originalOffer.productId,
              title: originalOffer.product.title,
              image: originalOffer.product.image,
              images: originalOffer.product.images,
              price: originalOffer.product.price,
              originalPrice: originalOffer.product.originalPrice,
              currency: originalOffer.product.currency,
              size: originalOffer.product.size,
              condition: originalOffer.product.condition,
            } : undefined,
          },
          messageType: 'offer',
          isDelivered: false,
          isRead: false,
        };

        setMessages(prev => {
          // Check if we already have this counter offer
          const exists = prev.some(m => 
            m.offerId === offerId && 
            m.offer?.status === 'countered' && 
            m.offer?.counterAmount === counterAmount
          );
          if (exists) return prev;
          return [...prev, optimisticMessage];
        });
      }

      const counterPayload = {
        type: 'counter_offer',
        offerId: offerId,
        counterAmount: counterAmount,
        receiverId: receiverId,
        text: counterText,
      };

      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('📤 Sending counter offer via WebSocket:', counterPayload);
        }
        wsRef.current.send(JSON.stringify(counterPayload));
      } catch (error) {
        console.error('Error sending counter offer:', error);
        // Remove optimistic message on error
        if (setMessages) {
          setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-counter-')));
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

