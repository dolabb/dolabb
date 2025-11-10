'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  HiArrowLeft,
  HiCheck,
  HiPaperAirplane,
  HiPaperClip,
  HiXMark,
} from 'react-icons/hi2';

// Mock users data
const users = [
  {
    id: '1',
    username: 'buyer123',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    lastMessage: 'Your offer',
    time: '2h ago',
    unread: 2,
  },
  {
    id: '2',
    username: 'fashion_lover',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    lastMessage: 'Counter offer',
    time: '5h ago',
    unread: 0,
  },
];

// Mock messages/offers
const offers = [
  {
    id: '1',
    type: 'your-offer',
    product: 'Vintage Denim Jacket',
    size: 'M',
    price: 13,
    offer: 9,
    shipping: 1,
    expires: '10 Feb 2025',
  },
  {
    id: '2',
    type: 'offer-received',
    product: 'Designer Leather Bag',
    size: 'One Size',
    price: 89.5,
    offer: 75.0,
    shipping: 5,
    expires: '15 Feb 2025',
  },
];

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
  attachments?: string[];
}

interface AttachedFile {
  id: string;
  file: File;
  preview: string;
}

export default function MessagesContent() {
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';
  const [selectedUser, setSelectedUser] = useState(users[0]);
  const [showChat, setShowChat] = useState(false); // Mobile: controls chat visibility
  const [messageText, setMessageText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! Is this item still available?',
      sender: 'other',
      timestamp: '10:30 AM',
    },
    {
      id: '2',
      text: 'Yes, it is available!',
      sender: 'me',
      timestamp: '10:32 AM',
    },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when chat opens on mobile only
  useEffect(() => {
    if (showChat && chatAreaRef.current) {
      // Check if mobile screen (width < 768px)
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setTimeout(() => {
          chatAreaRef.current?.scrollTo({
            top: chatAreaRef.current.scrollHeight,
            behavior: 'auto',
          });
        }, 150);
      }
    }
  }, [showChat]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
          if (e.target?.result) {
            const newFile: AttachedFile = {
              id: Date.now().toString() + Math.random(),
              file,
              preview: e.target.result as string,
            };
            setAttachedFiles(prev => [...prev, newFile]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && attachedFiles.length === 0) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText.trim(),
      sender: 'me',
      timestamp: new Date().toLocaleTimeString(
        locale === 'ar' ? 'ar-SA' : 'en-US',
        {
          hour: '2-digit',
          minute: '2-digit',
        }
      ),
      attachments: attachedFiles.map(f => f.preview),
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
    setAttachedFiles([]);
  };

  const handleUserSelect = (user: (typeof users)[0]) => {
    setSelectedUser(user);
    setShowChat(true);
  };

  const handleBackToUsers = () => {
    setShowChat(false);
  };

  return (
    <div className='bg-off-white min-h-screen' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='h-screen flex flex-col'>
        <div className='bg-white border-b border-rich-sand/30 flex-shrink-0'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
            <h1 className='text-2xl font-bold text-deep-charcoal'>
              {locale === 'en' ? 'Messages' : 'الرسائل'}
            </h1>
          </div>
        </div>
        <div className='flex-1 flex overflow-hidden'>
          {/* Users List */}
          <div
            className={`${
              showChat ? 'hidden' : 'flex'
            } md:flex w-full md:w-80 flex-col border-r border-rich-sand/30 overflow-hidden`}
          >
            <div className='flex-1 overflow-y-auto scrollbar-transparent divide-y divide-rich-sand/30'>
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-rich-sand/10 transition-colors text-left cursor-pointer ${
                    selectedUser.id === user.id ? 'bg-saudi-green/5' : ''
                  }`}
                >
                  <div className='relative w-12 h-12 rounded-full overflow-hidden bg-rich-sand/20 flex-shrink-0'>
                    <Image
                      src={user.avatar}
                      alt={user.username}
                      fill
                      className='object-cover'
                      unoptimized
                    />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between mb-1'>
                      <h3 className='font-semibold text-deep-charcoal truncate'>
                        @{user.username}
                      </h3>
                      <span className='text-xs text-deep-charcoal/60 flex-shrink-0 ml-2'>
                        {user.time}
                      </span>
                    </div>
                    <p className='text-sm text-deep-charcoal/70 truncate'>
                      {user.lastMessage}
                    </p>
                  </div>
                  {user.unread > 0 && (
                    <span className='bg-saudi-green text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0'>
                      {user.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div
            className={`${
              showChat ? 'flex' : 'hidden'
            } md:flex flex-1 flex-col`}
          >
            {selectedUser && (
              <>
                {/* Chat Header */}
                <div className='p-4 border-b border-rich-sand/30 flex items-center gap-3 flex-shrink-0'>
                  <button
                    onClick={handleBackToUsers}
                    className='md:hidden p-2 hover:bg-rich-sand/10 rounded-lg transition-colors cursor-pointer'
                    aria-label={locale === 'en' ? 'Back' : 'رجوع'}
                  >
                    <HiArrowLeft className='w-5 h-5 text-deep-charcoal' />
                  </button>
                  <div className='relative w-10 h-10 rounded-full overflow-hidden bg-rich-sand/20 flex-shrink-0'>
                    <Image
                      src={selectedUser.avatar}
                      alt={selectedUser.username}
                      fill
                      className='object-cover'
                      unoptimized
                    />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-semibold text-deep-charcoal truncate'>
                      @{selectedUser.username}
                    </h3>
                    <p className='text-xs text-deep-charcoal/60'>
                      {locale === 'en' ? 'Active now' : 'نشط الآن'}
                    </p>
                  </div>
                </div>

                {/* Messages Area */}
                <div
                  ref={chatAreaRef}
                  className='flex-1 overflow-y-auto scrollbar-transparent p-4 space-y-4 bg-off-white/50'
                >
                  {/* Offers */}
                  {offers.map(offer => (
                    <div
                      key={offer.id}
                      className={`bg-rich-sand/10 rounded-lg p-4 ${
                        offer.type === 'your-offer'
                          ? 'border-l-4 border-blue-500'
                          : 'border-l-4 border-saudi-green'
                      }`}
                    >
                      {offer.type === 'your-offer' ? (
                        <div>
                          <div className='flex items-center justify-between mb-2'>
                            <span className='text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded'>
                              {locale === 'en' ? 'Your Offer' : 'عرضك'}
                            </span>
                            <span className='text-xs text-deep-charcoal/60'>
                              {locale === 'en' ? 'Expires' : 'ينتهي'}:{' '}
                              {offer.expires}
                            </span>
                          </div>
                          <p className='font-semibold text-deep-charcoal mb-2'>
                            {offer.product}
                          </p>
                          <div className='text-sm space-y-1 text-deep-charcoal/70'>
                            <p>
                              {offer.size} - {locale === 'ar' ? 'ر.س' : 'SAR'}{' '}
                              {offer.price}
                            </p>
                            <p>
                              {locale === 'en' ? 'Offer' : 'العرض'}:{' '}
                              {locale === 'ar' ? 'ر.س' : 'SAR'} {offer.offer}
                            </p>
                            <p>
                              {locale === 'en' ? 'Shipping' : 'الشحن'}: +
                              {locale === 'ar' ? 'ر.س' : 'SAR'} {offer.shipping}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className='flex items-center justify-between mb-2'>
                            <span className='text-xs font-semibold text-saudi-green bg-green-100 px-2 py-1 rounded'>
                              {locale === 'en' ? 'Offer Received' : 'عرض مستلم'}
                            </span>
                            <span className='text-xs text-deep-charcoal/60'>
                              {locale === 'en' ? 'Expires' : 'ينتهي'}:{' '}
                              {offer.expires}
                            </span>
                          </div>
                          <p className='font-semibold text-deep-charcoal mb-2'>
                            {offer.product}
                          </p>
                          <div className='text-sm space-y-1 text-deep-charcoal/70 mb-3'>
                            <p>
                              {offer.size} - {locale === 'ar' ? 'ر.س' : 'SAR'}{' '}
                              {offer.price}
                            </p>
                            <p>
                              {locale === 'en' ? 'Offer' : 'العرض'}:{' '}
                              {locale === 'ar' ? 'ر.س' : 'SAR'} {offer.offer}
                            </p>
                            <p>
                              {locale === 'en' ? 'Shipping' : 'الشحن'}: +
                              {locale === 'ar' ? 'ر.س' : 'SAR'} {offer.shipping}
                            </p>
                          </div>
                          <div className='flex gap-2'>
                            <button
                              onClick={() => {
                                // Redirect to checkout with offer data
                                const offerData = {
                                  id: offer.id,
                                  product: offer.product,
                                  size: offer.size,
                                  price: offer.price,
                                  offer: offer.offer,
                                  shipping: offer.shipping,
                                };
                                // Encode offer data as query params
                                const params = new URLSearchParams({
                                  offerId: offer.id,
                                  product: offer.product,
                                  size: offer.size,
                                  price: offer.price.toString(),
                                  offerPrice: offer.offer.toString(),
                                  shipping: offer.shipping.toString(),
                                });
                                router.push(`/${locale}/checkout?${params.toString()}`);
                              }}
                              className='flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors cursor-pointer'
                            >
                              <HiCheck className='w-5 h-5' />
                              {locale === 'en' ? 'Accept' : 'قبول'}
                            </button>
                            <button className='flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-saudi-green text-white rounded-lg font-medium hover:bg-saudi-green/90 transition-colors cursor-pointer'>
                              {locale === 'en' ? 'Counter' : 'مقابل'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Regular Messages */}
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === 'me'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] md:max-w-[70%] ${
                          message.sender === 'me'
                            ? 'bg-saudi-green text-white'
                            : 'bg-white border border-rich-sand/30'
                        } rounded-lg p-3 space-y-2`}
                      >
                        {message.attachments &&
                          message.attachments.length > 0 && (
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
                        {message.text && (
                          <p
                            className={`text-sm ${
                              message.sender === 'me'
                                ? 'text-white'
                                : 'text-deep-charcoal'
                            }`}
                          >
                            {message.text}
                          </p>
                        )}
                        <p
                          className={`text-xs ${
                            message.sender === 'me'
                              ? 'text-white/70'
                              : 'text-deep-charcoal/60'
                          }`}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Area */}
                <div className='border-t border-rich-sand/30 p-3 md:p-4 bg-white flex-shrink-0'>
                  {/* Attached Files Preview */}
                  {attachedFiles.length > 0 && (
                    <div className='mb-3 flex flex-wrap gap-2'>
                      {attachedFiles.map(file => (
                        <div
                          key={file.id}
                          className='relative w-20 h-20 rounded-lg overflow-hidden bg-rich-sand/20 border border-rich-sand/30'
                        >
                          <Image
                            src={file.preview}
                            alt={file.file.name}
                            fill
                            className='object-cover'
                            unoptimized
                          />
                          <button
                            onClick={() => removeAttachment(file.id)}
                            className='absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer'
                            aria-label={locale === 'en' ? 'Remove' : 'إزالة'}
                          >
                            <HiXMark className='w-3 h-3' />
                          </button>
                          <div className='absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate'>
                            {file.file.name.length > 10
                              ? file.file.name.substring(0, 10) + '...'
                              : file.file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input Form */}
                  <form
                    onSubmit={handleSendMessage}
                    className='flex items-end gap-2'
                  >
                    <input
                      type='file'
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept='image/*'
                      multiple
                      className='hidden'
                      id='file-attachment'
                    />
                    <label
                      htmlFor='file-attachment'
                      className='p-2.5 md:p-3 bg-rich-sand/10 hover:bg-rich-sand/20 rounded-lg cursor-pointer transition-colors flex-shrink-0'
                      aria-label={locale === 'en' ? 'Attach file' : 'إرفاق ملف'}
                    >
                      <HiPaperClip className='w-5 h-5 text-deep-charcoal' />
                    </label>
                    <div className='flex-1 relative'>
                      <textarea
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        placeholder={
                          locale === 'en'
                            ? 'Type a message...'
                            : 'اكتب رسالة...'
                        }
                        className='w-full px-4 py-2.5 md:py-3 pr-12 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green resize-none'
                        rows={1}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        style={{
                          minHeight: '44px',
                          maxHeight: '120px',
                        }}
                      />
                    </div>
                    <button
                      type='submit'
                      disabled={
                        !messageText.trim() && attachedFiles.length === 0
                      }
                      className='p-2.5 md:p-3 bg-saudi-green text-white rounded-lg hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer'
                      aria-label={
                        locale === 'en' ? 'Send message' : 'إرسال رسالة'
                      }
                    >
                      <HiPaperAirplane className='w-5 h-5' />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
