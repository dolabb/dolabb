'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useRef, useEffect } from 'react';
import { HiCheck } from 'react-icons/hi2';
import ProductMessageCard from '../ProductMessageCard';
import { formatMessageTime } from '../utils';
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
  loadMoreMessages?: () => void;
  hasMoreMessages?: boolean;
  isLoadingMore?: boolean;
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
  loadMoreMessages,
  hasMoreMessages = false,
  isLoadingMore = false,
}: ChatAreaProps) {
  const locale = useLocale();
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesStartRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
  const shouldScrollToBottom = useRef<boolean>(true);
  const previousMessagesLength = useRef<number>(0);

  // Scroll to bottom when new messages arrive (sent or received)
  useEffect(() => {
    const currentMessagesLength = messages.length;
    const hasNewMessage = currentMessagesLength > previousMessagesLength.current;
    
    // Only auto-scroll if there's a new message and we're not loading older messages
    if (hasNewMessage && messagesEndRef.current && !isLoadingMore) {
      const chatArea = chatAreaRef.current;
      if (chatArea) {
        const { scrollTop, scrollHeight, clientHeight } = chatArea;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        const isNearBottom = distanceFromBottom < 500; // 500px threshold
        
        // Always scroll if:
        // 1. User is near bottom (within 500px), OR
        // 2. It's a new message from current user (they just sent it)
        const lastMessage = messages[messages.length - 1];
        const isMyNewMessage = lastMessage && lastMessage.sender === 'me';
        
        if (isNearBottom || isMyNewMessage) {
          // Use setTimeout to ensure DOM has updated with new message
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 50);
        }
      } else {
        // If chatArea not available yet, scroll anyway
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 50);
      }
    }
    
    previousMessagesLength.current = currentMessagesLength;
  }, [messages, isLoadingMore]);

  // Handle scroll to load more messages
  useEffect(() => {
    const chatArea = chatAreaRef.current;
    if (!chatArea || !loadMoreMessages || !hasMoreMessages || isLoadingMore) {
      return;
    }

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatArea;
      
      // Check if user scrolled to top (within 100px of top)
      if (scrollTop < 100 && hasMoreMessages && !isLoadingMore) {
        // Store current scroll position
        previousScrollHeight.current = scrollHeight;
        loadMoreMessages();
      }
      
      // Check if user is near bottom (within 500px)
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 500;
      shouldScrollToBottom.current = isNearBottom;
    };

    chatArea.addEventListener('scroll', handleScroll);
    return () => {
      chatArea.removeEventListener('scroll', handleScroll);
    };
  }, [loadMoreMessages, hasMoreMessages, isLoadingMore]);

  // Maintain scroll position when loading more messages
  useEffect(() => {
    if (!isLoadingMore && chatAreaRef.current && previousScrollHeight.current > 0) {
      const chatArea = chatAreaRef.current;
      const newScrollHeight = chatArea.scrollHeight;
      const scrollDifference = newScrollHeight - previousScrollHeight.current;
      chatArea.scrollTop = scrollDifference;
      previousScrollHeight.current = 0;
    }
  }, [isLoadingMore, messages]);

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
        <>
          {hasMoreMessages && (
            <div className='flex justify-center py-2' ref={messagesStartRef}>
              <button
                onClick={loadMoreMessages}
                disabled={isLoadingMore}
                className='px-4 py-2 text-sm text-deep-charcoal/60 hover:text-deep-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
              >
                {isLoadingMore ? (
                  <>
                    <div className='w-4 h-4 border-2 border-deep-charcoal/30 border-t-deep-charcoal/60 rounded-full animate-spin'></div>
                    {locale === 'en' ? 'Loading...' : 'جاري التحميل...'}
                  </>
                ) : (
                  <>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 15l7-7 7 7' />
                    </svg>
                    {locale === 'en' ? 'Load previous messages' : 'تحميل الرسائل السابقة'}
                  </>
                )}
              </button>
            </div>
          )}
          {messages.map(message => {
          // Explicitly check if this is a text message - if so, never render as offer card
          const isTextMessage = message.messageType === 'text' || 
                                (!message.messageType && !message.offerId && !message.offer);
          
          // Only render as offer card if:
          // 1. messageType is explicitly 'offer' AND has offerId/offer
          // 2. OR has offerId AND offer object (not null/undefined)
          // 3. AND is NOT a text message
          const shouldRenderAsOffer = !isTextMessage && (
            (message.messageType === 'offer' && (message.offerId || message.offer)) ||
            (message.offerId && message.offer && message.offerId !== null && message.offerId !== undefined) ||
            (message.offer && (
              message.offer.offerAmount ||
              message.offer.offer ||
              message.offer.counterAmount ||
              message.offer.status
            ))
          );

          if (shouldRenderAsOffer) {
            return (
              <ProductMessageCard
                key={message.id}
                message={message}
                messages={messages}
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
                    {message.rawTimestamp 
                      ? formatMessageTime(message.rawTimestamp, locale)
                      : (message.timestamp || (locale === 'en' ? 'Just now' : 'الآن'))}
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
        })}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

