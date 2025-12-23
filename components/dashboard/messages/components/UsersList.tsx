'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { ConversationUser, OnlineUserDetail } from '../types';
import { formatUsername } from '../utils';

interface UsersListProps {
  conversations: ConversationUser[];
  selectedConversation: ConversationUser | null;
  isLoading: boolean;
  isWebSocketConnected: boolean;
  onlineUsers: string[]; // Backward compatible - array of user IDs
  onlineUsersDetails?: OnlineUserDetail[]; // Enhanced - array of user objects with username and profileImage
  onSelectConversation: (conversation: ConversationUser) => void;
  showChat: boolean;
}

export default function UsersList({
  conversations,
  selectedConversation,
  isLoading,
  isWebSocketConnected,
  onlineUsers,
  onlineUsersDetails = [],
  onSelectConversation,
  showChat,
}: UsersListProps) {
  const locale = useLocale();
  const router = useRouter();

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
            {locale === 'en' ? 'No conversations yet' : 'لا توجد محادثات بعد'}
          </div>
        ) : (
          conversations.map(conv => {
            // Enhance with online user details if available
            let displayUser = conv.otherUser;
            if (onlineUsersDetails && onlineUsersDetails.length > 0) {
              const onlineUserDetail = onlineUsersDetails.find(
                u => u.id === conv.otherUser.id
              );
              if (onlineUserDetail) {
                displayUser = {
                  ...conv.otherUser,
                  username:
                    onlineUserDetail.username || conv.otherUser.username,
                  profileImage:
                    onlineUserDetail.profileImage ||
                    conv.otherUser.profileImage,
                };
              }
            }

            const formattedUsername = formatUsername(displayUser.username);
            const isOnline =
              isWebSocketConnected &&
              (onlineUsers.includes(conv.otherUser.id) ||
                conv.otherUser.isOnline);

            // Normalize profile image URL - convert cdn.dolabb.com URLs to use Next.js proxy
            const normalizeImageUrl = (
              url: string | undefined | null
            ): string => {
              if (
                !url ||
                url.trim() === '' ||
                url === 'undefined' ||
                url === 'null'
              ) {
                return '';
              }
              const trimmed = url.trim().replace(/\s+/g, '');

              // If URL starts with http://, convert to https://
              let normalized = trimmed.startsWith('http://')
                ? trimmed.replace('http://', 'https://')
                : trimmed;

              // If URL is relative (starts with /), prepend base URL
              if (normalized.startsWith('/') && !normalized.startsWith('//')) {
                normalized = `https://dolabb-backend-2vsj.onrender.com${normalized}`;
              }

              // Convert cdn.dolabb.com URLs to use Next.js proxy to bypass SSL issues
              if (normalized.includes('cdn.dolabb.com')) {
                try {
                  const urlObj = new URL(normalized);
                  const path = urlObj.pathname + urlObj.search;
                  return `/api/cdn${path}`;
                } catch {
                  // If URL parsing fails, try simple string replacement
                  const path = normalized
                    .replace('https://cdn.dolabb.com', '')
                    .replace('http://cdn.dolabb.com', '');
                  return `/api/cdn${path}`;
                }
              }
              return normalized;
            };

            const normalizedProfileImage = normalizeImageUrl(
              displayUser.profileImage
            );

            return (
              <div
                key={conv.id}
                className={`w-full p-4 flex items-center gap-3 hover:bg-rich-sand/10 transition-colors ${
                  selectedConversation?.id === conv.id ? 'bg-saudi-green/5' : ''
                }`}
              >
                <button
                  onClick={e => {
                    e.stopPropagation();
                    router.push(`/${locale}/user/${conv.otherUser.id}`);
                  }}
                  className='relative w-12 h-12 rounded-full overflow-visible flex-shrink-0 cursor-pointer hover:ring-2 ring-saudi-green/50 transition-all z-10'
                  title={locale === 'en' ? 'View Profile' : 'عرض الملف الشخصي'}
                >
                  <div className='w-12 h-12 rounded-full overflow-hidden bg-rich-sand/20'>
                    {normalizedProfileImage ? (
                      normalizedProfileImage.startsWith('/api/cdn') ? (
                        <img
                          src={normalizedProfileImage}
                          alt={formattedUsername}
                          className='w-full h-full object-cover'
                          onError={e => {
                            (e.target as HTMLImageElement).style.display =
                              'none';
                          }}
                        />
                      ) : (
                        <Image
                          src={normalizedProfileImage}
                          alt={formattedUsername}
                          fill
                          className='object-cover w-12 h-12 rounded-full'
                          unoptimized
                          onError={() => {
                            console.error(
                              'Profile image failed to load:',
                              normalizedProfileImage
                            );
                          }}
                        />
                      )
                    ) : (
                      <div className='w-full h-full flex items-center justify-center bg-saudi-green/20 text-saudi-green font-semibold'>
                        {formattedUsername.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {isOnline && (
                    <div className='absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10'></div>
                  )}
                </button>
                <button
                  onClick={() => onSelectConversation(conv)}
                  className='flex-1 min-w-0 text-left cursor-pointer'
                >
                  <div className='flex items-center justify-between mb-1'>
                    <h3 className='font-semibold text-deep-charcoal truncate'>
                      {formattedUsername}
                    </h3>
                    <div className='flex items-center gap-2 flex-shrink-0 ml-2'>
                      {isOnline && (
                        <span className='text-xs text-green-600 font-medium flex items-center gap-1'>
                          <span className='w-2 h-2 bg-green-500 rounded-full'></span>
                          {locale === 'en' ? 'Online' : 'متصل'}
                        </span>
                      )}
                      {parseInt(conv.unreadCount || '0') > 0 && (
                        <span className='inline-flex items-center justify-center min-w-[20px] h-5 px-2 rounded-full bg-green-500 text-white text-xs font-semibold'>
                          {parseInt(conv.unreadCount) > 99
                            ? '99+'
                            : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className='text-sm text-deep-charcoal/70 truncate'>
                    {conv.lastMessage ||
                      (locale === 'en' ? 'No messages' : 'لا توجد رسائل')}
                  </p>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
