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
import type { AttachedFile, ConversationUser } from '../types';
import { formatMessageTime } from '../utils';

interface MessageInputProps {
  selectedConversation: ConversationUser | null;
  user: any;
  wsRef: React.MutableRefObject<WebSocket | null>;
  onMessageSent: () => void;
}

export default function MessageInput({
  selectedConversation,
  user,
  wsRef,
  onMessageSent,
}: MessageInputProps) {
  const locale = useLocale();
  const [messageText, setMessageText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sendMessageMutation] = useSendMessageMutation();

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && attachedFiles.length === 0) return;
    if (!selectedConversation || !user) return;

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
            ? 'Failed to upload attachments'
            : 'فشل تحميل المرفقات'
        );
        return;
      }
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
        wsRef.current.send(
          JSON.stringify({
            type: 'chat_message',
            senderId: user.id,
            receiverId: receiverId,
            text: text,
            attachments: attachmentUrls,
            offerId: null,
            productId: selectedConversation.productId || null,
          })
        );
        setMessageText('');
        setAttachedFiles([]);
        onMessageSent();
      } catch (error) {
        console.error('Error sending message via WebSocket:', error);
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
          offerId: null,
          productId: selectedConversation.productId || null,
        });
        setMessageText('');
        setAttachedFiles([]);
        onMessageSent();
      } catch (error: any) {
        console.error('Error sending message:', error);
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
          accept='image/*'
          multiple
          className='hidden'
          id='file-attachment'
        />
        <label
          htmlFor='file-attachment'
          className='group relative p-2.5 md:p-3 bg-gradient-to-br from-rich-sand/20 to-rich-sand/10 hover:from-rich-sand/30 hover:to-rich-sand/20 rounded-xl cursor-pointer transition-all duration-200 flex-shrink-0 shadow-sm hover:shadow-md border border-rich-sand/20 hover:border-rich-sand/30'
          aria-label={locale === 'en' ? 'Attach file' : 'إرفاق ملف'}
        >
          <HiPaperClip className='w-5 h-5 text-deep-charcoal group-hover:text-saudi-green transition-colors duration-200' />
          <div className='absolute inset-0 rounded-xl bg-saudi-green/0 group-hover:bg-saudi-green/5 transition-colors duration-200'></div>
        </label>
        <div className='flex-1 relative flex items-center'>
          <textarea
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            placeholder={
              locale === 'en' ? 'Type a message...' : 'اكتب رسالة...'
            }
            className='w-full px-4 py-2.5 md:py-3 pr-14 border border-rich-sand/30 rounded-3xl focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green resize-none flex items-center'
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
            disabled={!messageText.trim() && attachedFiles.length === 0}
            className='absolute right-2 top-1/2 -translate-y-1/2 group p-2 bg-gradient-to-br from-saudi-green to-green-600 text-white rounded-full hover:from-saudi-green/90 hover:to-green-600/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-saudi-green disabled:hover:to-green-600 cursor-pointer shadow-md hover:shadow-lg hover:scale-110 active:scale-95 disabled:hover:scale-100 disabled:hover:shadow-md'
            aria-label={locale === 'en' ? 'Send message' : 'إرسال رسالة'}
          >
            <HiPaperAirplane className='w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200' />
            <div className='absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-colors duration-200'></div>
          </button>
        </div>
      </form>
    </div>
  );
}

