import { apiClient } from '@/lib/api/client';
import { useAppSelector } from '@/lib/store/hooks';
import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConversationUser, Message } from '../types';
import { formatMessageTime, formatUsername } from '../utils';

const WS_BASE_URL = 'wss://dolabb-backend-2vsj.onrender.com';

interface UseWebSocketProps {
  conversationId: string | null;
  selectedConversation: ConversationUser | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  refetchConversations: () => void;
  user: any;
  setConversationId?: (id: string | null) => void;
  isQueryInitialized?: boolean; // Flag to check if query is ready
}

export function useWebSocket({
  conversationId,
  selectedConversation,
  setMessages,
  refetchConversations,
  user,
  setConversationId,
  isQueryInitialized = true, // Default to true for backward compatibility
}: UseWebSocketProps) {
  const locale = useLocale();
  const token =
    useAppSelector(state => state.auth.token) ||
    (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [otherUserOnlineStatus, setOtherUserOnlineStatus] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  
  // Track if we can safely refetch (query must be initialized and not currently fetching)
  const canRefetchRef = useRef(false);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const componentMountTimeRef = useRef<number>(Date.now());
  
  // Update ref when query initialization status changes
  useEffect(() => {
    // Add a delay before marking as ready to ensure query is fully initialized
    if (initializationTimeoutRef.current) {
      clearTimeout(initializationTimeoutRef.current);
    }
    
    if (isQueryInitialized) {
      // Wait a bit more before allowing refetch to ensure query is truly ready
      // Also ensure at least 2 seconds have passed since component mount
      const timeSinceMount = Date.now() - componentMountTimeRef.current;
      const delay = Math.max(2000 - timeSinceMount, 500); // At least 2 seconds total, or 500ms minimum
      
      initializationTimeoutRef.current = setTimeout(() => {
        canRefetchRef.current = true;
      }, delay);
    } else {
      canRefetchRef.current = false;
    }
    
    return () => {
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
      }
    };
  }, [isQueryInitialized]);

  // Safe refetch function that handles errors gracefully
  // Only refetch when query is initialized and only for important events (offers, not regular messages)
  const safeRefetchConversations = useCallback((force: boolean = false) => {
    // Don't refetch if query is not initialized
    if (!canRefetchRef.current && !force) {
      return;
    }
    
    // Early return if refetchConversations is not available
    if (!refetchConversations || typeof refetchConversations !== 'function') {
      return;
    }
    
    // Use multiple layers of delay to ensure query is fully initialized
    // This prevents the "Cannot refetch a query that has not been started yet" error
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            // Final check before refetching
            if (!canRefetchRef.current && !force) {
              return;
            }
            
            // Use a function wrapper with immediate try-catch to catch synchronous errors
            // Wrap in an immediately invoked function to ensure errors are caught
            let result: any;
            try {
              // Use a wrapper function to catch any synchronous errors
              const callRefetch = () => {
                try {
                  return refetchConversations();
                } catch (e: any) {
                  // Catch any synchronous errors and convert to rejected promise
                  const errorMessage = e?.message || String(e || '');
                  if (errorMessage.includes('not been started') || 
                      errorMessage.includes('Cannot refetch')) {
                    // Return a resolved promise to prevent error propagation
                    return Promise.resolve();
                  }
                  // For other errors, also return resolved promise to prevent propagation
                  return Promise.resolve();
                }
              };
              result = callRefetch();
            } catch (syncError: any) {
              // This catch should never be reached due to inner catch, but just in case
              const errorMessage = syncError?.message || String(syncError || '');
              if (errorMessage.includes('not been started') || 
                  errorMessage.includes('Cannot refetch')) {
                return;
              }
              return;
            }
            
            // If it returns a promise, handle it
            if (result && typeof result.then === 'function') {
              result.catch((error: any) => {
                // Silently handle ALL refetch errors - don't log them
                // These are expected during initialization
                const errorMessage = error?.message || String(error || '');
                if (errorMessage.includes('not been started') || 
                    errorMessage.includes('Cannot refetch')) {
                  // Query not initialized yet, that's okay - silently ignore
                  return;
                }
                // Silently ignore all refetch errors to prevent console spam
              });
            }
          } catch (error: any) {
            // Silently handle any remaining errors
            const errorMessage = error?.message || String(error || '');
            if (errorMessage.includes('not been started') || 
                errorMessage.includes('Cannot refetch')) {
              // Query not initialized yet, that's okay - silently ignore
              return;
            }
            // Silently ignore all refetch errors
          }
        }, 500); // Delay to ensure query is initialized
      });
    });
  }, [refetchConversations]);

  const handleWebSocketMessage = useCallback(
    (data: any) => {
      try {
        switch (data.type) {
          case 'online_users':
            if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
              setOnlineUsers(data.onlineUsers);
              if (selectedConversation?.otherUser.id) {
                const isOtherUserOnline = data.onlineUsers.includes(
                  selectedConversation.otherUser.id
                );
                setOtherUserOnlineStatus(isOtherUserOnline);
              }
            }
            break;

          case 'user_status':
            if (data.user_id && data.status) {
              if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
                setOnlineUsers(data.onlineUsers);
              }
              if (selectedConversation?.otherUser.id === data.user_id) {
                setOtherUserOnlineStatus(data.status === 'online');
                if (data.status === 'online') {
                  toast.info(
                    locale === 'en'
                      ? `${formatUsername(
                          selectedConversation.otherUser.username
                        )} is now online`
                      : `${formatUsername(
                          selectedConversation.otherUser.username
                        )} متصل الآن`
                  );
                }
              }
            }
            break;

          case 'chat_message':
            if (data.message) {
              // Update conversationId if we received it in the WebSocket message and it's currently null
              if (data.conversationId && !conversationId && setConversationId) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('🔧 Setting conversationId from WebSocket message:', data.conversationId);
                }
                setConversationId(data.conversationId);
              }
              
              // Use backend's isSender and sender fields if available (most reliable)
              // Fallback to checking senderId if backend fields not available
              const isMyMessage =
                data.message.isSender !== undefined
                  ? data.message.isSender
                  : data.message.sender === 'me' ||
                    (data.message.senderId && data.message.senderId === user?.id);

              if (process.env.NODE_ENV === 'development') {
                console.log('💬 Processing chat_message:', {
                  messageId: data.message.id,
                  isMyMessage,
                  isSender: data.message.isSender,
                  sender: data.message.sender,
                  senderId: data.message.senderId,
                  userId: user?.id,
                  messageType: data.message.messageType,
                  offerId: data.message.offerId,
                  text: data.message.text?.substring(0, 50),
                  conversationId: data.conversationId,
                  currentConversationId: conversationId,
                });
              }

              // Check if this is an offer message using backend's messageType field
              // Backend sets messageType to "offer" for offer-related messages
              // Explicitly check that messageType is NOT 'text' to avoid false positives
              const isOfferMessage = 
                (data.message.messageType === 'offer' || !!data.message.offerId) &&
                data.message.messageType !== 'text';

              // Use offer object from top level (data.offer) if available, otherwise from message
              // Only include offer object if this is actually an offer message
              const offerObject = isOfferMessage ? (data.offer || data.message.offer) : undefined;

              const rawTimestamp = data.message.timestamp || data.message.createdAt;
              const newMessage: Message = {
                id: data.message.id,
                text: isOfferMessage ? '' : (data.message.text || ''),
                sender: data.message.sender || (isMyMessage ? 'me' : 'other'),
                timestamp: formatMessageTime(rawTimestamp, locale),
                rawTimestamp: rawTimestamp, // Store original timestamp for sorting
                attachments: data.message.attachments || [],
                senderId: data.message.senderId,
                receiverId: data.message.receiverId,
                // Only include offerId and productId if this is actually an offer message
                offerId: isOfferMessage ? (data.message.offerId || offerObject?.id || undefined) : undefined,
                productId: isOfferMessage
                  ? (data.message.productId ||
                      offerObject?.productId ||
                      offerObject?.product?.id ||
                      undefined)
                  : undefined,
                offer: offerObject && isOfferMessage ? {
                  id: offerObject.id,
                  offerAmount: offerObject.offerAmount,
                  counterAmount: offerObject.counterAmount,
                  originalPrice: offerObject.originalPrice,
                  status: offerObject.status,
                  productId: offerObject.productId,
                  shippingCost: offerObject.shippingCost || offerObject.shipping,
                  product: offerObject.product ? {
                    id: offerObject.product.id || offerObject.productId,
                    title: offerObject.product.title,
                    image: offerObject.product.image,
                    images: offerObject.product.images,
                    price: offerObject.product.price,
                    originalPrice: offerObject.product.originalPrice,
                    currency: offerObject.product.currency,
                    size: offerObject.product.size,
                    condition: offerObject.product.condition,
                  } : undefined,
                } : undefined,
                messageType: data.message.messageType || (isOfferMessage ? 'offer' : 'text'),
                isDelivered: isMyMessage
                  ? data.message.isDelivered !== undefined
                    ? data.message.isDelivered
                    : true
                  : undefined,
                isRead: isMyMessage
                  ? data.message.isRead !== undefined
                    ? data.message.isRead
                    : false
                  : undefined,
              };

              // Always add the message if it matches the current conversation
              // This ensures real-time updates work correctly
              setMessages(prev => {
                // Check if message already exists by ID
                const existsById = prev.some(msg => msg.id === newMessage.id);
                if (existsById) {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('⚠️ Message already exists by ID, skipping:', newMessage.id);
                  }
                  return prev;
                }

                // For my messages, try to replace optimistic temp messages
                if (isMyMessage) {
                  const now = Date.now();
                  // Find matching optimistic messages (more flexible matching)
                  // Sort by time (most recent first) to match the latest one
                  const tempMessages = prev
                    .map((msg, index) => ({ msg, index }))
                    .filter(({ msg }) => {
                      if (!msg.id.startsWith('temp-')) return false;
                      if (
                        msg.senderId !== newMessage.senderId ||
                        msg.sender !== 'me'
                      )
                        return false;

                      const tempTimeMatch = msg.id.match(/^temp-(\d+)-/);
                      if (tempTimeMatch) {
                        const tempTime = parseInt(tempTimeMatch[1]);
                        // Increase timeout to 30 seconds to handle slower responses
                        if (now - tempTime > 30000) return false;
                      }

                      // Match by text content (case-insensitive, trimmed)
                      const tempText = (msg.text || '').trim().toLowerCase();
                      const realText = (newMessage.text || '').trim().toLowerCase();
                      
                      // Also match by attachments if present
                      const tempAttachments = (msg.attachments || []).length;
                      const realAttachments = (newMessage.attachments || []).length;
                      const attachmentsMatch = tempAttachments === realAttachments;
                      
                      return tempText === realText && attachmentsMatch;
                    })
                    .sort((a, b) => {
                      // Sort by timestamp (most recent first)
                      const timeA = a.msg.id.match(/^temp-(\d+)-/)?.[1] || '0';
                      const timeB = b.msg.id.match(/^temp-(\d+)-/)?.[1] || '0';
                      return parseInt(timeB) - parseInt(timeA);
                    });

                  if (tempMessages.length > 0) {
                    // Replace the most recent matching optimistic message (first in sorted array)
                    const { index } = tempMessages[0];
                    const updated = [...prev];
                    updated[index] = {
                      ...newMessage,
                      isDelivered: true,
                    };
                    // Remove any other duplicate optimistic messages with same content that haven't been replaced
                    // But keep all real messages and the one we just replaced
                    const final = updated.filter((msg, idx) => {
                      if (idx === index) return true; // Keep the replaced message
                      if (!msg.id.startsWith('temp-')) return true; // Keep all non-temp messages
                      // Only remove temp messages that match this real message's content
                      // This prevents removing temp messages for other pending sends
                      const msgText = (msg.text || '').trim().toLowerCase();
                      const newMsgText = (newMessage.text || '').trim().toLowerCase();
                      const msgAttachments = (msg.attachments || []).length;
                      const newMsgAttachments = (newMessage.attachments || []).length;
                      // Only remove if it's the exact same content AND same sender
                      const isExactMatch = msgText === newMsgText && 
                                          msgAttachments === newMsgAttachments &&
                                          msg.senderId === newMessage.senderId;
                      // Keep temp messages that don't match (they're for other pending sends)
                      return !isExactMatch;
                    });
                    if (process.env.NODE_ENV === 'development') {
                      console.log('✅ Replaced optimistic message with real message:', {
                        realId: newMessage.id,
                        replacedIndex: index,
                        remainingMessages: final.length,
                      });
                    }
                    return final;
                  } else {
                    // No matching optimistic message found, but this is my message
                    // This can happen if the message was sent before WebSocket was connected
                    // or if the optimistic message was already replaced
                    // Clean up old temp messages and add the real message
                    const cleaned = prev.filter(msg => {
                      if (!msg.id.startsWith('temp-')) return true;
                      const tempTimeMatch = msg.id.match(/^temp-(\d+)-/);
                      if (tempTimeMatch) {
                        const tempTime = parseInt(tempTimeMatch[1]);
                        return now - tempTime <= 30000; // Keep temp messages for 30 seconds
                      }
                      return true;
                    });
                    // Check again if message exists after cleaning
                    const stillExists = cleaned.some(msg => msg.id === newMessage.id);
                    if (!stillExists) {
                      if (process.env.NODE_ENV === 'development') {
                        console.log('✅ Adding real message (no optimistic match found):', newMessage.id);
                      }
                      // Add message and sort to maintain chronological order (oldest first, newest last)
                      const updated = [...cleaned, newMessage];
                      return updated.sort((a, b) => {
                        try {
                          const timeA = a.rawTimestamp 
                            ? new Date(a.rawTimestamp).getTime()
                            : (a.id && !a.id.startsWith('temp-') ? parseInt(a.id.substring(0, 8), 16) * 1000 : Date.now());
                          const timeB = b.rawTimestamp 
                            ? new Date(b.rawTimestamp).getTime()
                            : (b.id && !b.id.startsWith('temp-') ? parseInt(b.id.substring(0, 8), 16) * 1000 : Date.now());
                          if (timeA > 0 && timeB > 0) {
                            return timeA - timeB; // Ascending order (oldest first)
                          }
                        } catch {}
                        return a.id.localeCompare(b.id);
                      });
                    }
                    if (process.env.NODE_ENV === 'development') {
                      console.log('⚠️ Real message already exists, keeping current state');
                    }
                    return cleaned;
                  }
                } else {
                  // Message from other user - check if it belongs to current conversation
                  let shouldAdd = false;
                  
                  // Priority 1: Check if conversationId from WebSocket matches current conversation
                  if (data.conversationId && conversationId && data.conversationId === conversationId) {
                    shouldAdd = true;
                    if (process.env.NODE_ENV === 'development') {
                      console.log('✅ Message matches by conversationId:', data.conversationId);
                    }
                  }
                  // Priority 2: If no conversationId match, check sender/receiver
                  else if (newMessage.senderId && newMessage.receiverId && user?.id) {
                    // Check if this message is between current user and other user
                    if (selectedConversation) {
                      const isFromOtherUser = newMessage.senderId === selectedConversation.otherUser.id;
                      const isToCurrentUser = newMessage.receiverId === user.id;
                      const isFromCurrentUser = newMessage.senderId === user.id;
                      const isToOtherUser = newMessage.receiverId === selectedConversation.otherUser.id;
                      
                      // Add if: (other user sends to current user) OR (current user sends to other user)
                      shouldAdd = (isFromOtherUser && isToCurrentUser) || (isFromCurrentUser && isToOtherUser);
                    } else {
                      // No conversation selected, but check if message is for current user
                      shouldAdd = newMessage.receiverId === user.id;
                    }
                    
                    if (process.env.NODE_ENV === 'development') {
                      console.log('🔍 Checking message match:', {
                        isFromOtherUser: selectedConversation ? newMessage.senderId === selectedConversation.otherUser.id : 'N/A',
                        isToCurrentUser: newMessage.receiverId === user.id,
                        shouldAdd,
                        senderId: newMessage.senderId,
                        receiverId: newMessage.receiverId,
                        otherUserId: selectedConversation?.otherUser.id,
                        currentUserId: user.id,
                        hasSelectedConversation: !!selectedConversation,
                      });
                    }
                  }
                  // Priority 3: Fallback - if message is addressed to current user, add it
                  else if (newMessage.receiverId === user?.id) {
                    shouldAdd = true;
                    if (process.env.NODE_ENV === 'development') {
                      console.log('✅ Message addressed to current user, adding it');
                    }
                  }
                  // Priority 4: Last fallback - if we have senderId matching other user, add it
                  else if (selectedConversation && newMessage.senderId === selectedConversation.otherUser.id) {
                    shouldAdd = true;
                    if (process.env.NODE_ENV === 'development') {
                      console.log('✅ Fallback: senderId matches other user, adding it');
                    }
                  }
                  // Priority 5: If no conversation selected, add all messages
                  else if (!selectedConversation) {
                    shouldAdd = true;
                    if (process.env.NODE_ENV === 'development') {
                      console.log('✅ No conversation selected, adding all messages');
                    }
                  }
                  
                  if (shouldAdd) {
                    // Check for duplicates by ID first (most reliable)
                    const duplicateById = prev.some(msg => msg.id === newMessage.id);
                    
                    if (duplicateById) {
                      if (process.env.NODE_ENV === 'development') {
                        console.log('⚠️ Duplicate message by ID, skipping:', newMessage.id);
                      }
                      return prev;
                    }
                    
                    // Also check for duplicates by content and sender (less strict, for edge cases)
                    // Only check if message was just added (within last few messages to avoid false positives)
                    const recentMessages = prev.slice(-5); // Check last 5 messages
                    const duplicateByContent = recentMessages.some(msg => 
                      msg.id !== newMessage.id && // Not the same ID
                      msg.senderId === newMessage.senderId && 
                      msg.receiverId === newMessage.receiverId &&
                      (msg.text || '').trim() === (newMessage.text || '').trim() &&
                      msg.attachments?.length === newMessage.attachments?.length
                    );
                    
                    if (!duplicateByContent) {
                      if (process.env.NODE_ENV === 'development') {
                        console.log('✅ Adding message from other user:', {
                          messageId: newMessage.id,
                          senderId: newMessage.senderId,
                          receiverId: newMessage.receiverId,
                          text: newMessage.text?.substring(0, 50),
                          conversationId: data.conversationId,
                          currentConversationId: conversationId,
                        });
                      }
                      // Add message and sort to maintain chronological order (oldest first, newest last)
                      const updated = [...prev, newMessage];
                      return updated.sort((a, b) => {
                        try {
                          const timeA = a.rawTimestamp 
                            ? new Date(a.rawTimestamp).getTime()
                            : (a.id && !a.id.startsWith('temp-') ? parseInt(a.id.substring(0, 8), 16) * 1000 : Date.now());
                          const timeB = b.rawTimestamp 
                            ? new Date(b.rawTimestamp).getTime()
                            : (b.id && !b.id.startsWith('temp-') ? parseInt(b.id.substring(0, 8), 16) * 1000 : Date.now());
                          if (timeA > 0 && timeB > 0) {
                            return timeA - timeB; // Ascending order (oldest first)
                          }
                        } catch {}
                        return a.id.localeCompare(b.id);
                      });
                    } else {
                      if (process.env.NODE_ENV === 'development') {
                        console.log('⚠️ Duplicate message by content, skipping:', newMessage.id);
                      }
                    }
                  } else {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('❌ Message not added - shouldAdd is false:', {
                        messageId: newMessage.id,
                        senderId: newMessage.senderId,
                        receiverId: newMessage.receiverId,
                        conversationId: data.conversationId,
                        currentConversationId: conversationId,
                        hasSelectedConversation: !!selectedConversation,
                        otherUserId: selectedConversation?.otherUser.id,
                        currentUserId: user?.id,
                      });
                    }
                  }
                }
                
                return prev;
              });

              // Don't refetch conversations on every chat message - it's not necessary
              // The WebSocket message already updates the UI instantly
              // Only refetch for important events like new conversations
            }
            break;

          case 'offer_sent':
          case 'offer_countered':
          case 'offer_accepted':
          case 'offer_rejected':
            if (data.offer) {
              // Update conversationId if we received it in the WebSocket message and it's currently null
              if (data.conversationId && !conversationId && setConversationId) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('🔧 Setting conversationId from offer message:', data.conversationId);
                }
                setConversationId(data.conversationId);
              }

              // Use backend's isSender and sender fields from message if available (most reliable)
              // Otherwise determine from offer data
              let isMyMessage = false;
              if (data.message) {
                // Backend provides isSender and sender in message object
                isMyMessage = data.message.isSender !== undefined
                  ? data.message.isSender
                  : data.message.sender === 'me' ||
                    (data.message.senderId && data.message.senderId === user?.id);
              } else {
                // Fallback: determine from offer data
                if (data.type === 'offer_countered') {
                  isMyMessage = data.offer.sellerId === user?.id;
                } else if (data.type === 'offer_sent') {
                  isMyMessage = data.offer.buyerId === user?.id;
                } else {
                  // For accept/reject: check based on who initiated the action
                  isMyMessage = data.offer.sellerId === user?.id;
                }
              }

              if (process.env.NODE_ENV === 'development') {
                console.log('💼 Processing offer message:', {
                  type: data.type,
                  messageId: data.message?.id,
                  isMyMessage,
                  isSender: data.message?.isSender,
                  sender: data.message?.sender,
                  senderId: data.message?.senderId || data.offer.sellerId || data.offer.buyerId,
                  offerId: data.offer.id,
                  status: data.offer.status,
                  conversationId: data.conversationId,
                });
              }
              
              // Use senderId and receiverId from message if available, otherwise from offer
              const messageSenderId = data.message?.senderId;
              const messageReceiverId = data.message?.receiverId;
              
              // Determine from offer data if not in message
              let offerSenderId: string | undefined;
              let offerReceiverId: string | undefined;
              if (!messageSenderId || !messageReceiverId) {
                if (data.type === 'offer_countered') {
                  // Seller countered buyer's offer: seller is sender, buyer is receiver
                  offerSenderId = data.offer.sellerId;
                  offerReceiverId = data.offer.buyerId;
                } else if (data.type === 'offer_sent') {
                  // Buyer sent initial offer: buyer is sender, seller is receiver
                  offerSenderId = data.offer.buyerId;
                  offerReceiverId = data.offer.sellerId;
                } else if (data.type === 'offer_accepted' || data.type === 'offer_rejected') {
                  // For accept/reject: sender is the one who accepted/rejected
                  // This could be seller (accepting buyer's offer) or buyer (accepting counter)
                  // Use the offer's current state to determine
                  offerSenderId = data.offer.sellerId; // Usually seller accepts/rejects
                  offerReceiverId = data.offer.buyerId;
                }
              }
              
              const offerRawTimestamp = data.message?.timestamp || 
                                       data.message?.createdAt || 
                                       data.offer.updatedAt || 
                                       data.offer.createdAt;
              
              // Build complete offer object matching backend structure
              const offerMessage: Message = {
                id: data.message?.id || `${data.type}_${data.offer.id}_${Date.now()}`,
                text: data.message?.text || '',
                sender: data.message?.sender || (isMyMessage ? 'me' : 'other'),
                senderId: messageSenderId || offerSenderId || (isMyMessage ? user?.id : selectedConversation?.otherUser.id),
                receiverId: messageReceiverId || offerReceiverId || (isMyMessage ? selectedConversation?.otherUser.id : user?.id),
                timestamp: formatMessageTime(offerRawTimestamp, locale),
                rawTimestamp: offerRawTimestamp, // Store original timestamp for sorting
                offerId: data.offer.id,
                productId: data.offer.productId || data.offer.product?.id,
                offer: {
                  id: data.offer.id,
                  offerAmount: data.offer.offerAmount,
                  counterAmount: data.offer.counterAmount,
                  originalPrice: data.offer.originalPrice,
                  status: data.offer.status || (data.type === 'offer_accepted' ? 'accepted' : data.type === 'offer_rejected' ? 'rejected' : data.type === 'offer_countered' ? 'countered' : 'pending'),
                  productId: data.offer.productId,
                  shippingCost: data.offer.shippingCost || data.offer.shipping,
                  product: data.offer.product
                    ? {
                        id: data.offer.product.id || data.offer.productId,
                        title: data.offer.product.title,
                        image: data.offer.product.image,
                        images: data.offer.product.images,
                        price: data.offer.product.price,
                        originalPrice: data.offer.product.originalPrice,
                        currency: data.offer.product.currency || 'SAR',
                        size: data.offer.product.size,
                        condition: data.offer.product.condition,
                      }
                    : undefined,
                },
                messageType: 'offer',
                isDelivered: isMyMessage
                  ? (data.message?.isDelivered !== undefined ? data.message.isDelivered : true)
                  : undefined,
                isRead: isMyMessage
                  ? (data.message?.isRead !== undefined ? data.message.isRead : false)
                  : undefined,
              };

              // Always add the offer message if it matches the current conversation
              setMessages(prev => {
                // For my messages (especially counter offers), try to replace optimistic messages
                if (isMyMessage && data.type === 'offer_countered') {
                  // Find optimistic counter offer messages to replace
                  const optimisticMessages = prev
                    .map((msg, index) => ({ msg, index }))
                    .filter(({ msg }) => {
                      if (!msg.id.startsWith('temp-counter-')) return false;
                      if (msg.offerId !== offerMessage.offerId) return false;
                      if (msg.offer?.counterAmount !== offerMessage.offer?.counterAmount) return false;
                      return true;
                    });

                  if (optimisticMessages.length > 0) {
                    // Replace the first optimistic message with the real one
                    const { index } = optimisticMessages[0];
                    const updated = [...prev];
                    updated[index] = {
                      ...offerMessage,
                      isDelivered: true,
                    };
                    // Remove any other duplicate optimistic messages
                    return updated.filter((msg, idx) => 
                      idx === index || !msg.id.startsWith('temp-counter-') || msg.offerId !== offerMessage.offerId
                    );
                  }
                }

                // Check if message already exists (by offerId and type to avoid duplicates)
                const exists = prev.some(m => {
                  // Check by exact ID match
                  if (m.id === offerMessage.id) return true;
                  // For counter offers, also check if we already have this offer with same status
                  if (data.type === 'offer_countered' && m.offerId === offerMessage.offerId) {
                    return m.offer?.status === 'countered' && m.offer?.counterAmount === offerMessage.offer?.counterAmount;
                  }
                  return false;
                });
                
                if (exists) return prev;
                
                // Check if this offer message belongs to the current conversation
                let shouldAdd = false;
                
                if (!selectedConversation) {
                  // No conversation selected, add all offer messages
                  shouldAdd = true;
                } else if (offerMessage.senderId && offerMessage.receiverId && user?.id) {
                  // Check if this offer is between current user and other user
                  const isFromOtherUser = offerMessage.senderId === selectedConversation.otherUser.id;
                  const isToCurrentUser = offerMessage.receiverId === user.id;
                  const isFromCurrentUser = offerMessage.senderId === user.id;
                  const isToOtherUser = offerMessage.receiverId === selectedConversation.otherUser.id;
                  
                  // Add if: (other user sends to current user) OR (current user sends to other user)
                  shouldAdd = (isFromOtherUser && isToCurrentUser) || (isFromCurrentUser && isToOtherUser);
                } else {
                  // Fallback: if productId matches or if sender/receiver matches, add it
                  // Also check if the offer belongs to current user (buyerId or sellerId matches)
                  const offerBelongsToUser = data.offer.buyerId === user?.id || data.offer.sellerId === user?.id;
                  shouldAdd = offerMessage.productId === selectedConversation.productId || 
                              offerMessage.senderId === selectedConversation.otherUser.id ||
                              offerMessage.senderId === user?.id ||
                              offerMessage.receiverId === user?.id ||
                              offerBelongsToUser;
                }
                
                if (shouldAdd) {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('✅ Adding offer message:', {
                      type: data.type,
                      offerId: offerMessage.offerId,
                      senderId: offerMessage.senderId,
                      receiverId: offerMessage.receiverId,
                      isMyMessage,
                      shouldAdd,
                      offerStatus: offerMessage.offer?.status,
                      hasOffer: !!offerMessage.offer,
                    });
                  }
                  // Add message and sort to maintain chronological order
                  const updated = [...prev, offerMessage];
                  return updated.sort((a, b) => {
                    try {
                      const timeA = a.rawTimestamp 
                        ? new Date(a.rawTimestamp).getTime()
                        : (a.id && !a.id.startsWith('temp-') ? parseInt(a.id.substring(0, 8), 16) * 1000 : Date.now());
                      const timeB = b.rawTimestamp 
                        ? new Date(b.rawTimestamp).getTime()
                        : (b.id && !b.id.startsWith('temp-') ? parseInt(b.id.substring(0, 8), 16) * 1000 : Date.now());
                      if (timeA > 0 && timeB > 0) {
                        return timeA - timeB; // Ascending order (oldest first)
                      }
                    } catch {}
                    return a.id.localeCompare(b.id);
                  });
                } else {
                  // If conversation matching failed but offer belongs to current user, still add it
                  const offerBelongsToUser = data.offer.buyerId === user?.id || data.offer.sellerId === user?.id;
                  if (offerBelongsToUser) {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('✅ Adding offer message (fallback - belongs to user):', {
                        type: data.type,
                        offerId: offerMessage.offerId,
                      });
                    }
                    const updated = [...prev, offerMessage];
                    return updated.sort((a, b) => {
                      try {
                        const timeA = a.rawTimestamp 
                          ? new Date(a.rawTimestamp).getTime()
                          : (a.id && !a.id.startsWith('temp-') ? parseInt(a.id.substring(0, 8), 16) * 1000 : Date.now());
                        const timeB = b.rawTimestamp 
                          ? new Date(b.rawTimestamp).getTime()
                          : (b.id && !b.id.startsWith('temp-') ? parseInt(b.id.substring(0, 8), 16) * 1000 : Date.now());
                        if (timeA > 0 && timeB > 0) {
                          return timeA - timeB;
                        }
                      } catch {}
                      return a.id.localeCompare(b.id);
                    });
                  }
                  
                  if (process.env.NODE_ENV === 'development') {
                    console.log('❌ Offer message not added - shouldAdd is false:', {
                      type: data.type,
                      offerId: offerMessage.offerId,
                      senderId: offerMessage.senderId,
                      receiverId: offerMessage.receiverId,
                      userId: user?.id,
                      hasSelectedConversation: !!selectedConversation,
                      otherUserId: selectedConversation?.otherUser.id,
                      offerBelongsToUser,
                    });
                  }
                }
                
                return prev;
              });
              
              // Refetch conversations for offer events (new offers, accepts, rejects, counters)
              // These are important events that should update the conversations list
              safeRefetchConversations();

              if (data.type === 'offer_sent') {
                toast.success(
                  locale === 'en'
                    ? `Offer of ${data.offer.offerAmount} SAR sent successfully`
                    : `تم إرسال عرض بقيمة ${data.offer.offerAmount} ريال بنجاح`
                );
              } else if (data.type === 'offer_countered') {
                toast.info(
                  locale === 'en'
                    ? `Counter offer of ${data.offer.counterAmount} SAR ${isMyMessage ? 'sent' : 'received'}`
                    : `تم ${isMyMessage ? 'إرسال' : 'استلام'} عرض مقابل بقيمة ${data.offer.counterAmount} ريال`
                );
              } else if (data.type === 'offer_accepted') {
                toast.success(
                  locale === 'en'
                    ? 'Offer accepted! Proceed to checkout'
                    : 'تم قبول العرض! تابع إلى الدفع'
                );
              } else if (data.type === 'offer_rejected') {
                toast.warning(
                  locale === 'en' ? 'Offer was rejected' : 'تم رفض العرض'
                );
              }
            }
            break;

          case 'error':
            const errorMsg = data.message || data.error;
            if (errorMsg === 'You cannot make an offer on your own product') {
              toast.error(
                locale === 'en'
                  ? 'You cannot make an offer on your own product'
                  : 'لا يمكنك تقديم عرض على منتجك الخاص'
              );
            } else if (errorMsg === 'You cannot purchase your own product') {
              toast.error(
                locale === 'en'
                  ? 'You cannot purchase your own product'
                  : 'لا يمكنك شراء منتجك الخاص'
              );
            } else {
              toast.error(
                errorMsg || (locale === 'en' ? 'An error occurred' : 'حدث خطأ')
              );
            }
            break;

          default:
            console.log('Unknown WebSocket message type:', data.type);
        }
      } catch (error: any) {
        // Silently handle refetch errors - these are expected during initialization
        const errorMessage = error?.message || String(error || '');
        if (errorMessage.includes('not been started') || 
            errorMessage.includes('Cannot refetch')) {
          // Query not initialized yet, that's okay - silently ignore
          return;
        }
        // Only log and show toast for actual errors, not refetch initialization errors
        console.error('Error handling WebSocket message:', error);
        toast.error(
          locale === 'en' ? 'Error processing message' : 'خطأ في معالجة الرسالة'
        );
      }
    },
    [user, locale, refetchConversations, selectedConversation, setMessages]
  );

  const initializeConversation = useCallback(
    async (receiverId: string) => {
      if (!token || !user) {
        toast.error(
          locale === 'en'
            ? 'Authentication required. Please login again.'
            : 'مطلوب تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.'
        );
        return;
      }

      setIsConnecting(true);

      try {
        const conversationsResponse = await apiClient.get(
          '/api/chat/conversations/',
          { timeout: 0 }
        );
        const conversations = conversationsResponse.data.conversations || [];

        let conversation = conversations.find(
          (conv: any) => conv.otherUser?.id === receiverId
        );

        if (!conversation) {
          try {
            await apiClient.post('/api/chat/send/', {
              receiverId: receiverId,
              text: locale === 'en' ? 'Hello!' : 'مرحبا!',
              productId: null,
              attachments: [],
              offerId: null,
            });

            const newConversationsResponse = await apiClient.get(
              '/api/chat/conversations/',
              { timeout: 0 }
            );
            const newConversations =
              newConversationsResponse.data.conversations || [];
            conversation = newConversations.find(
              (conv: any) => conv.otherUser?.id === receiverId
            );
          } catch (error: any) {
            console.error('Error creating conversation:', error);
            toast.error(
              locale === 'en'
                ? 'Failed to start conversation. Please try again.'
                : 'فشل بدء المحادثة. يرجى المحاولة مرة أخرى.'
            );
            setIsConnecting(false);
            return;
          }
        }

        if (!conversation) {
          toast.error(
            locale === 'en'
              ? 'Could not find or create conversation'
              : 'تعذر العثور على المحادثة أو إنشاؤها'
          );
          setIsConnecting(false);
          return;
        }

        const convId = conversation.conversationId || conversation.id;

        if (
          wsRef.current &&
          wsRef.current.readyState === WebSocket.OPEN &&
          conversationId === convId
        ) {
          setIsConnecting(false);
          setIsWebSocketConnected(true);
          return;
        }

        const connectionState = { isIntentionallyClosed: false };

        if (wsRef.current && conversationId && conversationId !== convId) {
          connectionState.isIntentionallyClosed = true;
          wsRef.current.close(1000, 'Switching conversation');
          wsRef.current = null;
        } else if (wsRef.current) {
          if (wsRef.current.readyState !== WebSocket.OPEN) {
            connectionState.isIntentionallyClosed = true;
            wsRef.current.close();
            wsRef.current = null;
          }
        }

        const wsUrl = `${WS_BASE_URL}/ws/chat/${convId}/?token=${encodeURIComponent(
          token
        )}`;

        const websocket = new WebSocket(wsUrl);

        const connectionTimeout = setTimeout(() => {
          if (websocket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket connection timeout');
            websocket.close();
            setIsConnecting(false);
            toast.error(
              locale === 'en'
                ? 'Connection timeout. Please try again.'
                : 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.'
            );
          }
        }, 10000);

        websocket.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('✅ WebSocket Connected successfully');
          setIsConnecting(false);
          setIsWebSocketConnected(true);
          connectionState.isIntentionallyClosed = false;
        };

        websocket.onmessage = event => {
          try {
            const data = JSON.parse(event.data);
            // Log incoming messages for debugging (can be removed in production)
            if (process.env.NODE_ENV === 'development') {
              console.log('📨 WebSocket message received:', data.type, data);
            }
            // Wrap handleWebSocketMessage in try-catch to catch refetch errors
            try {
              handleWebSocketMessage(data);
            } catch (wsError: any) {
              // Silently handle refetch errors - these are expected during initialization
              const errorMessage = wsError?.message || String(wsError || '');
              if (errorMessage.includes('not been started') || 
                  errorMessage.includes('Cannot refetch')) {
                // Query not initialized yet, that's okay - silently ignore
                return;
              }
              // For other errors, log them but don't show toast (to avoid spam)
              console.error('Error handling WebSocket message:', wsError);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            toast.error(
              locale === 'en'
                ? 'Error receiving message'
                : 'خطأ في استقبال الرسالة'
            );
          }
        };

        websocket.onerror = error => {
          clearTimeout(connectionTimeout);
          console.error('WebSocket Error:', error);
          setIsConnecting(false);
        };

        websocket.onclose = event => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket closed:', event.code, event.reason);
          setIsConnecting(false);
          setIsWebSocketConnected(false);

          if (connectionState.isIntentionallyClosed) {
            return;
          }

          if (event.code === 4001) {
            toast.error(
              locale === 'en'
                ? 'Authentication failed. Please login again.'
                : 'فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.'
            );
            return;
          }
        };

        wsRef.current = websocket;
        connectionState.isIntentionallyClosed = false;
        
        if (setConversationId) {
          setConversationId(convId);
        }
      } catch (error: any) {
        console.error('Error initializing conversation:', error);
        setIsConnecting(false);
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          (locale === 'en'
            ? 'Failed to initialize chat. Please try again.'
            : 'فشل تهيئة الدردشة. يرجى المحاولة مرة أخرى.');
        toast.error(errorMessage);
      }
    },
    [token, user, locale, conversationId, handleWebSocketMessage]
  );

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return {
    isConnecting,
    isWebSocketConnected,
    otherUserOnlineStatus,
    onlineUsers,
    wsRef,
    initializeConversation,
  };
}

