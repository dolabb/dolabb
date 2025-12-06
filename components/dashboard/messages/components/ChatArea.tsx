'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { HiArrowDownTray, HiCheck } from 'react-icons/hi2';
import ProductMessageCard from '../ProductMessageCard';
import type { ConversationUser, Message } from '../types';
import { formatMessageTime } from '../utils';

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

  // Debug: Log when hasMoreMessages prop changes
  useEffect(() => {
    console.log(
      '🔔 [ChatArea] hasMoreMessages prop received:',
      hasMoreMessages,
      {
        timestamp: new Date().toISOString(),
        messagesCount: messages.length,
      }
    );
  }, [hasMoreMessages, messages.length]);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesStartRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
  const shouldScrollToBottom = useRef<boolean>(true);
  const previousMessagesLength = useRef<number>(0);

  // Helper function to check if file is PDF
  const isPDF = (url: string): boolean => {
    return (
      url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('.pdf')
    );
  };

  // Helper function to check if file is image
  const isImage = (url: string): boolean => {
    const imageExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.svg',
      '.bmp',
    ];
    return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  // Normalize image URL - convert cdn.dolabb.com URLs to use Next.js proxy
  const normalizeImageUrl = (url: string): string => {
    if (!url) return '';
    // Clean any spaces in URL first
    let trimmed = url.trim().replace(/\s+/g, '');
    if (trimmed.includes('cdn.dolabb.com')) {
      try {
        // Extract the path after cdn.dolabb.com
        const urlObj = new URL(trimmed);
        const path = urlObj.pathname + urlObj.search;
        // Use Next.js proxy route - remove leading slash if present to avoid double slashes
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `/api/cdn${cleanPath}`;
      } catch (error) {
        // If URL parsing fails, try simple string replacement
        const path = trimmed.replace('https://cdn.dolabb.com', '').replace('http://cdn.dolabb.com', '');
        return `/api/cdn${path}`;
      }
    }
    return trimmed;
  };

  // Download file
  const downloadFile = async (url: string, filename?: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || url.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Scroll to bottom when new messages arrive (sent or received)
  useEffect(() => {
    const currentMessagesLength = messages.length;
    const hasNewMessage =
      currentMessagesLength > previousMessagesLength.current;

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
    if (
      !isLoadingMore &&
      chatAreaRef.current &&
      previousScrollHeight.current > 0
    ) {
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
        </div>
      ) : (
        <>
          {/* Loading animation with dots when loading more messages */}
          {isLoadingMore && (
            <div className='flex justify-center py-4' ref={messagesStartRef}>
              <div className='flex items-center gap-2 text-deep-charcoal/60'>
                <div className='flex gap-1'>
                  <div
                    className='w-2 h-2 bg-deep-charcoal/40 rounded-full animate-bounce'
                    style={{ animationDelay: '0ms' }}
                  ></div>
                  <div
                    className='w-2 h-2 bg-deep-charcoal/40 rounded-full animate-bounce'
                    style={{ animationDelay: '150ms' }}
                  ></div>
                  <div
                    className='w-2 h-2 bg-deep-charcoal/40 rounded-full animate-bounce'
                    style={{ animationDelay: '300ms' }}
                  ></div>
                </div>
                <span className='text-sm'>
                  {locale === 'en' ? 'Loading messages' : 'جاري تحميل الرسائل'}
                </span>
              </div>
            </div>
          )}

          {/* Show button ONLY if hasMoreMessages is true (no fallback when we know there are no more) */}
          {!isLoadingMore && hasMoreMessages && (
            <div className='flex justify-center py-2' ref={messagesStartRef}>
              <button
                onClick={loadMoreMessages}
                disabled={isLoadingMore}
                className='px-4 py-2 text-sm text-deep-charcoal/60 hover:text-deep-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 15l7-7 7 7'
                  />
                </svg>
                {locale === 'en'
                  ? 'Load previous messages'
                  : 'تحميل الرسائل السابقة'}
              </button>
            </div>
          )}

          {/* Show "No more messages" when there are no more messages to load */}
          {!isLoadingMore && !hasMoreMessages && messages.length > 0 && (
            <div className='flex justify-center py-4'>
              <p className='text-sm text-deep-charcoal/40 italic'>
                {locale === 'en'
                  ? 'No more messages to load'
                  : 'لا توجد رسائل أخرى للتحميل'}
              </p>
            </div>
          )}
          {messages.map(message => {
            // Explicitly check if this is a text message - if so, never render as offer card
            const isTextMessage =
              message.messageType === 'text' ||
              (!message.messageType && !message.offerId && !message.offer);

            // Only render as offer card if:
            // 1. messageType is explicitly 'offer' AND has offerId/offer
            // 2. OR has offerId AND offer object (not null/undefined)
            // 3. AND is NOT a text message
            const shouldRenderAsOffer =
              !isTextMessage &&
              ((message.messageType === 'offer' &&
                (message.offerId || message.offer)) ||
                (message.offerId &&
                  message.offer &&
                  message.offerId !== null &&
                  message.offerId !== undefined) ||
                (message.offer &&
                  (message.offer.offerAmount ||
                    message.offer.offer ||
                    message.offer.counterAmount ||
                    message.offer.status)));

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
                  className={`${
                    message.attachments && message.attachments.length > 0
                      ? 'max-w-[90%] md:max-w-[75%] lg:max-w-[70%]' // Wider for messages with attachments
                      : 'max-w-[85%] md:max-w-[70%] lg:max-w-[65%]' // Normal width for text-only
                  } ${
                    message.sender === 'me'
                      ? 'bg-gradient-to-br from-saudi-green to-green-600 text-white shadow-md'
                      : 'bg-white border border-rich-sand/30 text-deep-charcoal shadow-sm'
                  } rounded-2xl ${
                    message.sender === 'me' ? 'rounded-br-sm' : 'rounded-bl-sm'
                  } ${
                    message.attachments && message.attachments.length > 0
                      ? 'p-0 overflow-hidden'
                      : 'p-3 space-y-2'
                  }`}
                >
                  {/* WhatsApp-style: Show attachments first, then text below */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className='space-y-2 -mx-3 -mt-3 mb-2'>
                      {message.attachments.map((attachment, idx) => {
                        const isImageFile = isImage(attachment);
                        const isPDFFile = isPDF(attachment);
                        const isFirstAttachment = idx === 0;
                        const attachments = message.attachments || [];
                        const isLastAttachment = idx === attachments.length - 1;
                        const hasTextBelow =
                          message.text && message.text.trim();
                        const normalizedAttachment = isImageFile ? normalizeImageUrl(attachment) : attachment;

                        return (
                          <div key={idx} className='relative'>
                            {isImageFile ? (
                              <div
                                className={`relative overflow-hidden bg-rich-sand/20 ${
                                  isFirstAttachment
                                    ? message.sender === 'me'
                                      ? 'rounded-t-2xl'
                                      : 'rounded-t-2xl'
                                    : 'rounded-t-lg'
                                } ${
                                  isLastAttachment && !hasTextBelow
                                    ? 'rounded-b-lg'
                                    : ''
                                }`}
                              >
                                {/* Image with responsive sizing */}
                                <div
                                  className='relative w-full bg-rich-sand/10 flex items-center justify-center py-3'
                                  style={{
                                    minHeight: '200px',
                                    maxHeight: '450px',
                                  }}
                                >
                                  <div className='relative w-full h-full flex items-center justify-center'>
                                    {normalizedAttachment.startsWith('/api/cdn') ? (
                                      <img
                                        src={normalizedAttachment}
                                        alt={`Attachment ${idx + 1}`}
                                        className='max-w-full max-h-[450px] w-auto h-auto object-contain'
                                        onError={(e) => {
                                          console.error('Attachment image failed to load:', normalizedAttachment);
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <Image
                                        src={normalizedAttachment}
                                        alt={`Attachment ${idx + 1}`}
                                        width={800}
                                        height={600}
                                        className='max-w-full max-h-[450px] w-auto h-auto object-contain'
                                        unoptimized
                                        sizes='(max-width: 768px) 90vw, 75vw'
                                        onError={() => {
                                          console.error('Attachment image failed to load:', normalizedAttachment);
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`p-3 sm:p-4 border-2 ${
                                  isFirstAttachment
                                    ? 'rounded-t-2xl'
                                    : 'rounded-t-lg'
                                } ${
                                  isLastAttachment && !hasTextBelow
                                    ? 'rounded-b-lg'
                                    : ''
                                } ${
                                  isPDFFile
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-rich-sand/20 border-rich-sand/30'
                                }`}
                              >
                                <div className='flex items-center gap-2 sm:gap-3'>
                                  <div className='flex-shrink-0'>
                                    {isPDFFile ? (
                                      <svg
                                        className='w-8 h-8 sm:w-10 sm:h-10 text-red-500'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                      >
                                        <path
                                          strokeLinecap='round'
                                          strokeLinejoin='round'
                                          strokeWidth={2}
                                          d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
                                        />
                                      </svg>
                                    ) : (
                                      <svg
                                        className='w-8 h-8 sm:w-10 sm:h-10 text-deep-charcoal/60'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                      >
                                        <path
                                          strokeLinecap='round'
                                          strokeLinejoin='round'
                                          strokeWidth={2}
                                          d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                        />
                                      </svg>
                                    )}
                                  </div>
                                  <div className='flex-1 min-w-0'>
                                    <p
                                      className={`text-xs sm:text-sm font-medium truncate ${
                                        message.sender === 'me'
                                          ? 'text-white'
                                          : 'text-deep-charcoal'
                                      }`}
                                    >
                                      {isPDFFile
                                        ? 'PDF Document'
                                        : 'File Attachment'}
                                    </p>
                                    <p className='text-[10px] sm:text-xs text-deep-charcoal/60 truncate'>
                                      {attachment.split('/').pop() || 'file'}
                                    </p>
                                  </div>
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      downloadFile(attachment);
                                    }}
                                    className='flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-saudi-green text-white text-xs sm:text-sm rounded-lg hover:bg-saudi-green/90 transition-colors flex-shrink-0'
                                    title={
                                      locale === 'en' ? 'Download' : 'تحميل'
                                    }
                                  >
                                    <HiArrowDownTray className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                                    <span className='hidden sm:inline'>
                                      {locale === 'en' ? 'Download' : 'تحميل'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Text message below attachments (WhatsApp style) */}
                  {message.text && message.text.trim() && (
                    <div
                      className={`${
                        message.attachments && message.attachments.length > 0
                          ? 'px-3 pb-2 pt-1'
                          : ''
                      }`}
                    >
                      <p
                        className={`text-sm leading-relaxed ${
                          message.sender === 'me'
                            ? 'text-white'
                            : 'text-deep-charcoal'
                        }`}
                      >
                        {message.text}
                      </p>
                    </div>
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
                        : message.timestamp ||
                          (locale === 'en' ? 'Just now' : 'الآن')}
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
