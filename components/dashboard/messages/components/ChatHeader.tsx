'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';
import { HiArrowLeft } from 'react-icons/hi2';
import type { ConversationUser, OnlineUserDetail } from '../types';
import { formatUsername } from '../utils';

interface ChatHeaderProps {
  selectedConversation: ConversationUser;
  isConnecting: boolean;
  isWebSocketConnected: boolean;
  onlineUsers: string[]; // Backward compatible - array of user IDs
  onlineUsersDetails?: OnlineUserDetail[]; // Enhanced - array of user objects with username and profileImage
  otherUserOnlineStatus: boolean;
  onBack: () => void;
}

export default function ChatHeader({
  selectedConversation,
  isConnecting,
  isWebSocketConnected,
  onlineUsers,
  onlineUsersDetails = [],
  otherUserOnlineStatus,
  onBack,
}: ChatHeaderProps) {
  const locale = useLocale();
  
  // Enhance with online user details if available
  let displayUser = selectedConversation.otherUser;
  if (onlineUsersDetails && onlineUsersDetails.length > 0) {
    const onlineUserDetail = onlineUsersDetails.find(u => u.id === selectedConversation.otherUser.id);
    if (onlineUserDetail) {
      displayUser = {
        ...selectedConversation.otherUser,
        username: onlineUserDetail.username || selectedConversation.otherUser.username,
        profileImage: onlineUserDetail.profileImage || selectedConversation.otherUser.profileImage,
      };
    }
  }
  
  const formattedUsername = formatUsername(displayUser.username);
  const isOnline =
    isWebSocketConnected &&
    (onlineUsers.includes(selectedConversation.otherUser.id) ||
      otherUserOnlineStatus);

  // Normalize profile image URL - convert cdn.dolabb.com URLs to use Next.js proxy
  const normalizeImageUrl = (url: string | undefined | null): string => {
    if (!url || url.trim() === '' || url === 'undefined' || url === 'null') {
      return '';
    }
    const trimmed = url.trim().replace(/\s+/g, '');
    if (trimmed.includes('cdn.dolabb.com')) {
      try {
        const urlObj = new URL(trimmed);
        const path = urlObj.pathname + urlObj.search;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `/api/cdn${cleanPath}`;
      } catch {
        const path = trimmed.replace('https://cdn.dolabb.com', '').replace('http://cdn.dolabb.com', '');
        return `/api/cdn${path}`;
      }
    }
    return trimmed;
  };

  const normalizedProfileImage = normalizeImageUrl(displayUser.profileImage);

  return (
    <div className='p-4 border-b border-rich-sand/30 flex items-center gap-3 flex-shrink-0'>
      <button
        onClick={onBack}
        className='md:hidden p-2 hover:bg-rich-sand/10 rounded-lg transition-colors cursor-pointer'
        aria-label={locale === 'en' ? 'Back' : 'رجوع'}
      >
        <HiArrowLeft className='w-5 h-5 text-deep-charcoal' />
      </button>
      <div className='relative w-10 h-10 rounded-full overflow-visible flex-shrink-0'>
        <div className='w-10 h-10 rounded-full overflow-hidden bg-rich-sand/20'>
          {normalizedProfileImage ? (
            normalizedProfileImage.startsWith('/api/cdn') ? (
              <img
                src={normalizedProfileImage}
                alt={formattedUsername}
                className='w-full h-full object-cover'
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Image
                src={normalizedProfileImage}
                alt={formattedUsername}
                fill
                className='object-cover w-10 h-10 rounded-full'
                unoptimized
                onError={() => {
                  console.error('Profile image failed to load:', normalizedProfileImage);
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
          <div className='absolute top-0 hidden right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10'></div>
        )}
      </div>
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2'>
          <h3 className='font-semibold text-deep-charcoal truncate'>
            {formattedUsername}
          </h3>
        </div>
        <p className='text-xs text-deep-charcoal/60 mt-0.5'>
          {isConnecting
            ? locale === 'en'
              ? 'Connecting...'
              : 'جاري الاتصال...'
            : isOnline
            ? locale === 'en'
              ? 'Online'
              : 'متصل'
            : locale === 'en'
            ? 'Offline'
            : 'غير متصل'}
        </p>
      </div>
    </div>
  );
}
