'use client';

import { apiClient } from '@/lib/api/client';
import { useSendMessageMutation } from '@/lib/api/chatApi';
import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useRef, useState } from 'react';
import {
  HiPaperAirplane,
  HiPaperClip,
  HiXMark,
} from 'react-icons/hi2';
import type { AttachedFile, ConversationUser, Message } from '../types';
import { formatMessageTime, validateMessageText } from '../utils';

interface MessageInputProps {
  selectedConversation: ConversationUser | null;
  user: any;
  wsRef: React.MutableRefObject<WebSocket | null>;
  onMessageSent: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export default function MessageInput({
  selectedConversation,
  user,
  wsRef,
  onMessageSent,
  setMessages,
}: MessageInputProps) {
  const locale = useLocale();
  const [messageText, setMessageText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sendMessageMutation] = useSendMessageMutation();
  const [validationError, setValidationError] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Only allow one file at a time - take the first file
      const file = files[0];
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target?.result) {
          const newFile: AttachedFile = {
            id: Date.now().toString() + Math.random(),
            file,
            preview: e.target.result as string,
          };
          // Replace any existing file with the new one (only 1 allowed)
          setAttachedFiles([newFile]);
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setMessageText(newText);

    // Validate text in real-time
    const validation = validateMessageText(newText, locale);
    if (!validation.isValid) {
      setValidationError(validation.message);
    } else {
      setValidationError('');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && attachedFiles.length === 0) return;
    if (!selectedConversation || !user) return;
    
    // Prevent duplicate sends
    if (isSending) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Message send already in progress, ignoring duplicate');
      }
      return;
    }

    // Validate message text before sending
    const validation = validateMessageText(messageText.trim(), locale);
    if (!validation.isValid) {
      setValidationError(validation.message);
      toast.error(validation.message);
      return;
    }

    setIsSending(true);
    const receiverId = selectedConversation.otherUser.id;
    const text = messageText.trim();

    let attachmentUrls: string[] = [];
    if (attachedFiles.length > 0) {
      try {
        for (const file of attachedFiles) {
          const formData = new FormData();
          formData.append('file', file.file);
          const uploadResponse = await apiClient.post(
            '/api/chat/upload/',
            formData
          );
          if (uploadResponse.data.fileUrl) {
            attachmentUrls.push(uploadResponse.data.fileUrl);
          }
        }
      } catch (error) {
        console.error('Error uploading attachments:', error);
        toast.error(
          locale === 'en'
            ? 'Failed to upload attachment'
            : 'فشل تحميل المرفق'
        );
        setIsSending(false);
        return;
      }
    }

    // Create optimistic message to show immediately
    const now = new Date().toISOString();
    const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMessage: Message = {
      id: tempMessageId,
      text: text,
      sender: 'me',
      timestamp: formatMessageTime(now, locale),
      rawTimestamp: now, // Store original timestamp for sorting
      attachments: attachmentUrls,
      senderId: user.id,
      receiverId: receiverId,
      isDelivered: false,
      isRead: false,
      // Do not include productId or offerId for regular text messages
      productId: undefined,
      offerId: undefined,
    };

    // Add optimistic message immediately and sort to maintain chronological order
    setMessages(prev => {
      const updated = [...prev, optimisticMessage];
      return updated.sort((a, b) => {
        try {
          const timeA = a.rawTimestamp 
            ? new Date(a.rawTimestamp).getTime()
            : (a.id && !a.id.startsWith('temp-') ? parseInt(a.id.substring(0, 8), 16) * 1000 : Date.now());
          const timeB = b.rawTimestamp 
            ? new Date(b.rawTimestamp).getTime()
            : (b.id && !b.id.startsWith('temp-') ? parseInt(b.id.substring(0, 8), 16) * 1000 : Date.now());
          if (timeA > 0 && timeB > 0) {
            return timeA - timeB; // Ascending order (oldest first, newest last)
          }
        } catch {}
        return a.id.localeCompare(b.id);
      });
    });
    setMessageText('');
    setAttachedFiles([]);
    setValidationError('');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const messagePayload = {
          type: 'chat_message',
          senderId: user.id,
          receiverId: receiverId,
          text: text,
          attachments: attachmentUrls,
          // Explicitly set to null/undefined to ensure no offer association
          offerId: null,
          productId: null,
          messageType: 'text', // Explicitly mark as text message
        };
        if (process.env.NODE_ENV === 'development') {
          console.log('📤 Sending message via WebSocket:', messagePayload);
        }
        wsRef.current.send(JSON.stringify(messagePayload));
        onMessageSent();
        // Reset sending state after a short delay to allow WebSocket to process
        setTimeout(() => setIsSending(false), 500);
      } catch (error) {
        console.error('Error sending message via WebSocket:', error);
        setIsSending(false);
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        toast.error(
          locale === 'en' ? 'Failed to send message' : 'فشل إرسال الرسالة'
        );
      }
    } else {
      try {
        await sendMessageMutation({
          receiverId: receiverId,
          text: text,
          attachments: attachmentUrls,
          // Explicitly set to null/undefined to ensure no offer association
          offerId: null,
          productId: null,
          messageType: 'text', // Explicitly mark as text message
        });
        onMessageSent();
        setIsSending(false);
      } catch (error: any) {
        console.error('Error sending message:', error);
        setIsSending(false);
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        const errorMsg =
          error?.response?.data?.message ||
          error?.message ||
          (locale === 'en'
            ? 'Failed to send message. Please try again.'
            : 'فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.');
        toast.error(errorMsg);
      }
    }
  };

  return (
    <div className='border-t border-rich-sand/30 p-3 md:p-4 bg-white flex-shrink-0'>
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
      <form onSubmit={handleSendMessage} className='flex items-center gap-2'>
        <input
          type='file'
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept='image/*,.pdf'
          className='hidden'
          id='file-attachment'
        />
        {/* Only show attach button if no file is attached (limit: 1 file per message) */}
        {attachedFiles.length === 0 ? (
          <label
            htmlFor='file-attachment'
            className='group relative p-2.5 md:p-3 bg-gradient-to-br from-rich-sand/20 to-rich-sand/10 hover:from-rich-sand/30 hover:to-rich-sand/20 rounded-xl cursor-pointer transition-all duration-200 flex-shrink-0 shadow-sm hover:shadow-md border border-rich-sand/20 hover:border-rich-sand/30'
            aria-label={locale === 'en' ? 'Attach file' : 'إرفاق ملف'}
          >
            <HiPaperClip className='w-5 h-5 text-deep-charcoal group-hover:text-saudi-green transition-colors duration-200' />
            <div className='absolute inset-0 rounded-xl bg-saudi-green/0 group-hover:bg-saudi-green/5 transition-colors duration-200'></div>
          </label>
        ) : (
          <div
            className='p-2.5 md:p-3 bg-rich-sand/10 rounded-xl flex-shrink-0 border border-rich-sand/20 opacity-50 cursor-not-allowed'
            title={locale === 'en' ? 'Remove current file to attach a new one' : 'أزل الملف الحالي لإرفاق ملف جديد'}
          >
            <HiPaperClip className='w-5 h-5 text-deep-charcoal/50' />
          </div>
        )}
        <div className='flex-1 relative flex flex-col'>
          {validationError && (
            <div className='mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700'>
              {validationError}
            </div>
          )}
          <div className='relative flex items-center'>
            <textarea
              value={messageText}
              onChange={handleTextChange}
              placeholder={
                locale === 'en' ? 'Type a message...' : 'اكتب رسالة...'
              }
              className={`w-full px-4 py-2.5 md:py-3 pr-14 border rounded-3xl focus:outline-none focus:ring-2 resize-none flex items-center ${
                validationError
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-rich-sand/30 focus:ring-saudi-green focus:border-saudi-green'
              }`}
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
            <button
              type='submit'
              disabled={
                (!messageText.trim() && attachedFiles.length === 0) ||
                !!validationError ||
                isSending
              }
              className='absolute right-2 top-1/2 -translate-y-1/2 group p-2 bg-gradient-to-br from-saudi-green to-green-600 text-white rounded-full hover:from-saudi-green/90 hover:to-green-600/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-saudi-green disabled:hover:to-green-600 cursor-pointer shadow-md hover:shadow-lg hover:scale-110 active:scale-95 disabled:hover:scale-100 disabled:hover:shadow-md'
              aria-label={locale === 'en' ? 'Send message' : 'إرسال رسالة'}
            >
              {isSending ? (
                <svg
                  className='w-4 h-4 animate-spin'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  />
                </svg>
              ) : (
                <HiPaperAirplane className='w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200' />
              )}
              <div className='absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-colors duration-200'></div>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

