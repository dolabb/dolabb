'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';
import type { ConversationUser } from '../types';
import { formatDate, formatUsername } from '../utils';

interface UsersListProps {
  conversations: ConversationUser[];
  selectedConversation: ConversationUser | null;
  isLoading: boolean;
  isWebSocketConnected: boolean;
  onlineUsers: string[];
  onSelectConversation: (conversation: ConversationUser) => void;
  showChat: boolean;
}

export default function UsersList({
  conversations,
  selectedConversation,
  isLoading,
  isWebSocketConnected,
  onlineUsers,
  onSelectConversation,
  showChat,
}: UsersListProps) {
  const locale = useLocale();

  return (
    <div
      className={`${
        showChat ? 'hidden' : 'flex'
      } md:flex w-full md:w-80 flex-col border-r border-rich-sand/30 overflow-hidden`}
    >
      <div className='flex-1 overflow-y-auto scrollbar-transparent divide-y divide-rich-sand/30'>
        {isLoading ? (
          <div className='divide-y divide-rich-sand/30'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='p-4 flex items-center gap-3'>
                <div className='relative w-12 h-12 rounded-full overflow-visible flex-shrink-0'>
                  <div className='w-12 h-12 rounded-full bg-rich-sand/20 skeleton-shimmer' />
                </div>
                <div className='flex-1 min-w-0 space-y-2'>
                  <div className='flex items-center justify-between'>
                    <div className='h-4 bg-rich-sand/20 rounded w-24 skeleton-shimmer' />
                    <div className='h-3 bg-rich-sand/10 rounded w-12 skeleton-shimmer' />
                  </div>
                  <div className='h-3 bg-rich-sand/10 rounded w-3/4 skeleton-shimmer' />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className='p-4 text-center text-deep-charcoal/60'>
            {locale === 'en'
              ? 'No conversations yet'
              : 'لا توجد محادثات بعد'}
          </div>
        ) : (
          conversations.map(conv => {
            const timeAgo = formatDate(conv.lastMessageAt, locale);
            const formattedUsername = formatUsername(conv.otherUser.username);
            const isOnline =
              isWebSocketConnected &&
              (onlineUsers.includes(conv.otherUser.id) || conv.otherUser.isOnline);

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-rich-sand/10 transition-colors text-left cursor-pointer ${
                  selectedConversation?.id === conv.id
                    ? 'bg-saudi-green/5'
                    : ''
                }`}
              >
                <div className='relative w-12 h-12 rounded-full overflow-visible flex-shrink-0'>
                  <div className='w-12 h-12 rounded-full overflow-hidden bg-rich-sand/20'>
                    {conv.otherUser.profileImage ? (
                      <Image
                        src={conv.otherUser.profileImage}
                        alt={formattedUsername}
                        fill
                        className='object-cover w-12 h-12 rounded-full'
                        unoptimized
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center bg-saudi-green/20 text-saudi-green font-semibold'>
                        {formattedUsername.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {isOnline && (
                    <div className='absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10'></div>
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between mb-1'>
                    <h3 className='font-semibold text-deep-charcoal truncate'>
                      {formattedUsername}
                    </h3>
                    {isOnline ? (
                      <span className='text-xs text-green-600 font-medium flex-shrink-0 ml-2 flex items-center gap-1'>
                        <span className='w-2 h-2 bg-green-500 rounded-full'></span>
                        {locale === 'en' ? 'Online' : 'متصل'}
                      </span>
                    ) : (
                      timeAgo && (
                        <span className='text-xs text-deep-charcoal/60 flex-shrink-0 ml-2'>
                          {timeAgo}
                        </span>
                      )
                    )}
                  </div>
                  <p className='text-sm text-deep-charcoal/70 truncate'>
                    {conv.lastMessage ||
                      (locale === 'en' ? 'No messages' : 'لا توجد رسائل')}
                  </p>
                </div>
                {parseInt(conv.unreadCount) > 0 && (
                  <span className='bg-saudi-green text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0'>
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

