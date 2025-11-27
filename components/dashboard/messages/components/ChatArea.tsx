'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useRef, useEffect } from 'react';
import { HiCheck } from 'react-icons/hi2';
import ProductMessageCard from '../ProductMessageCard';
import type { ConversationUser, Message } from '../types';

interface ChatAreaProps {
  messages: Message[];
  selectedConversation: ConversationUser | null;
  isLoading: boolean;
  isFetching: boolean;
  error: any;
  user: any;
  onAcceptOffer: (
    offerId: string,
    receiverId: string,
    text?: string
  ) => Promise<void>;
  onCounterOffer: (
    offerId: string,
    counterAmount: number,
    receiverId: string,
    text?: string,
    originalOffer?: any
  ) => Promise<void>;
  onRejectOffer: (
    offerId: string,
    receiverId: string,
    text?: string
  ) => Promise<void>;
  sendOffer: (
    productId: string,
    offerAmount: number,
    receiverId: string,
    shippingDetails?: any
  ) => Promise<void>;
  onRetry: () => void;
  conversationId: string | null;
}

export default function ChatArea({
  messages,
  selectedConversation,
  isLoading,
  isFetching,
  error,
  user,
  onAcceptOffer,
  onCounterOffer,
  onRejectOffer,
  sendOffer,
  onRetry,
  conversationId,
}: ChatAreaProps) {
  const locale = useLocale();
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const formatMessageTime = (
    dateString: string | undefined | null
  ): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return locale === 'en' ? 'Just now' : 'الآن';
      } else if (diffMins < 60) {
        return locale === 'en' ? `${diffMins}m ago` : `منذ ${diffMins} دقيقة`;
      } else if (diffHours < 24) {
        return locale === 'en' ? `${diffHours}h ago` : `منذ ${diffHours} ساعة`;
      } else if (diffDays < 7) {
        return locale === 'en' ? `${diffDays}d ago` : `منذ ${diffDays} يوم`;
      } else {
        return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
          month: 'short',
          day: 'numeric',
        });
      }
    } catch {
      return '';
    }
  };

  return (
    <div
      ref={chatAreaRef}
      className='flex-1 overflow-y-auto scrollbar-transparent p-4 space-y-4 bg-off-white/50'
    >
      {(isLoading || isFetching) && messages.length === 0 ? (
        <div className='space-y-4'>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`flex ${
                i % 2 === 0 ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] md:max-w-[70%] rounded-2xl ${
                  i % 2 === 0
                    ? 'rounded-br-sm bg-gradient-to-br from-rich-sand/20 to-rich-sand/10'
                    : 'rounded-bl-sm bg-white border border-rich-sand/20'
                } p-3 space-y-2`}
              >
                <div className='space-y-1.5'>
                  <div
                    className={`h-4 rounded ${
                      i % 2 === 0 ? 'bg-rich-sand/30' : 'bg-rich-sand/20'
                    } skeleton-shimmer`}
                    style={{ width: `${60 + Math.random() * 30}%` }}
                  />
                  {i % 3 === 0 && (
                    <div
                      className={`h-4 rounded ${
                        i % 2 === 0 ? 'bg-rich-sand/30' : 'bg-rich-sand/20'
                      } skeleton-shimmer`}
                      style={{ width: `${40 + Math.random() * 20}%` }}
                    />
                  )}
                </div>
                <div
                  className={`flex items-center gap-1.5 mt-2 ${
                    i % 2 === 0 ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`h-3 rounded w-16 ${
                      i % 2 === 0 ? 'bg-rich-sand/20' : 'bg-rich-sand/10'
                    } skeleton-shimmer`}
                  />
                  {i % 2 === 0 && (
                    <div className='h-3 w-3 rounded bg-rich-sand/20 skeleton-shimmer' />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !selectedConversation ? null : messages.length === 0 &&
        !isLoading &&
        !isFetching ? (
        <div className='flex items-center justify-center h-full text-deep-charcoal/60'>
          <div className='text-center'>
            <p className='mb-2'>
              {locale === 'en'
                ? 'No messages yet. Start the conversation!'
                : 'لا توجد رسائل بعد. ابدأ المحادثة!'}
            </p>
            {error && (
              <div className='mt-4 space-y-2'>
                <p className='text-sm text-red-500'>
                  {locale === 'en'
                    ? 'Error loading messages. Please try again.'
                    : 'خطأ في تحميل الرسائل. يرجى المحاولة مرة أخرى.'}
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <div className='mt-2 p-2 bg-red-50 rounded text-xs text-red-700 max-w-md mx-auto'>
                    <p>
                      <strong>Error:</strong>{' '}
                      {JSON.stringify(
                        (error as any)?.data ||
                          (error as any)?.status ||
                          'Unknown error'
                      )}
                    </p>
                    <p>
                      <strong>User Role:</strong> {user?.role}
                    </p>
                    <p>
                      <strong>Conversation ID:</strong> {conversationId}
                    </p>
                    <p>
                      <strong>User ID:</strong> {user?.id}
                    </p>
                  </div>
                )}
                {selectedConversation?.lastMessage && (
                  <div className='mt-4 p-3 bg-rich-sand/20 rounded-lg border border-rich-sand/30'>
                    <p className='text-xs text-deep-charcoal/60 mb-1'>
                      {locale === 'en' ? 'Last message:' : 'آخر رسالة:'}
                    </p>
                    <p className='text-sm text-deep-charcoal'>
                      {selectedConversation.lastMessage}
                    </p>
                    {selectedConversation.lastMessageAt && (
                      <p className='text-xs text-deep-charcoal/40 mt-1'>
                        {formatDate(selectedConversation.lastMessageAt)}
                      </p>
                    )}
                  </div>
                )}
                <button
                  onClick={onRetry}
                  className='mt-4 px-4 py-2 bg-saudi-green text-white rounded-lg hover:bg-saudi-green/90 transition-colors text-sm'
                >
                  {locale === 'en' ? 'Retry' : 'إعادة المحاولة'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        messages.map(message => {
          const hasActualOffer =
            message.offer &&
            (message.offer.offerAmount ||
              message.offer.offer ||
              message.offer.counterAmount ||
              message.offer.status ||
              message.messageType === 'offer');

          if (hasActualOffer || (message.offerId && message.offer)) {
            return (
              <ProductMessageCard
                key={message.id}
                message={message}
                locale={locale}
                user={user}
                selectedConversation={selectedConversation}
                onAcceptOffer={onAcceptOffer}
                onCounterOffer={onCounterOffer}
                onRejectOffer={onRejectOffer}
                sendOffer={sendOffer}
              />
            );
          }

          return (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'me' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] md:max-w-[70%] ${
                  message.sender === 'me'
                    ? 'bg-gradient-to-br from-saudi-green to-green-600 text-white shadow-md'
                    : 'bg-white border border-rich-sand/30 text-deep-charcoal shadow-sm'
                } rounded-2xl ${
                  message.sender === 'me' ? 'rounded-br-sm' : 'rounded-bl-sm'
                } p-3 space-y-2`}
              >
                {message.attachments && message.attachments.length > 0 && (
                  <div className='grid grid-cols-2 gap-2 mb-2'>
                    {message.attachments.map((attachment, idx) => (
                      <div
                        key={idx}
                        className='relative aspect-square rounded-lg overflow-hidden bg-rich-sand/20'
                      >
                        <Image
                          src={attachment}
                          alt={`Attachment ${idx + 1}`}
                          fill
                          className='object-cover'
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                )}
                {message.text && message.text.trim() && (
                  <p
                    className={`text-sm leading-relaxed ${
                      message.sender === 'me'
                        ? 'text-white'
                        : 'text-deep-charcoal'
                    }`}
                  >
                    {message.text}
                  </p>
                )}
                <div
                  className={`flex items-center gap-1.5 mt-2 ${
                    message.sender === 'me' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <p
                    className={`text-xs ${
                      message.sender === 'me'
                        ? 'text-white/70'
                        : 'text-deep-charcoal/60'
                    }`}
                  >
                    {message.timestamp || (locale === 'en' ? 'Just now' : 'الآن')}
                  </p>
                  {message.sender === 'me' && (
                    <div className='flex items-center ml-0.5'>
                      {message.isRead ? (
                        <div className='flex items-center -space-x-1'>
                          <HiCheck className='w-3.5 h-3.5 text-blue-300' />
                          <HiCheck className='w-3.5 h-3.5 text-blue-300' />
                        </div>
                      ) : message.isDelivered ? (
                        <div className='flex items-center -space-x-1'>
                          <HiCheck className='w-3.5 h-3.5 text-white/70' />
                          <HiCheck className='w-3.5 h-3.5 text-white/70' />
                        </div>
                      ) : (
                        <HiCheck className='w-3.5 h-3.5 text-white/50' />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

