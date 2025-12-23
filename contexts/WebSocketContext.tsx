'use client';

import { useGetConversationsQuery } from '@/lib/api/chatApi';
import { useAppSelector } from '@/lib/store/hooks';
import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

const WS_BASE_URL = 'wss://dolabb-backend-2vsj.onrender.com';

interface WebSocketContextType {
  wsRef: React.MutableRefObject<WebSocket | null>;
  isConnected: boolean;
  isConnecting: boolean;
  unreadCount: number;
  onlineUsers: string[];
  onlineUsersDetails: Array<{ id: string; username: string; profileImage?: string }>;
  connectToConversation: (conversationId: string) => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const token = useAppSelector(state => state.auth.token) || 
    (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const user = useAppSelector(state => state.auth.user);
  const pathname = usePathname();
  const isOnMessagesPage = pathname?.includes('/messages');

  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [onlineUsersDetails, setOnlineUsersDetails] = useState<Array<{ id: string; username: string; profileImage?: string }>>([]);
  
  const currentConversationIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isIntentionallyClosedRef = useRef<boolean>(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loginTimeRef = useRef<number | null>(null);
  const connectAfterLoginTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  // Fetch conversations to get unread count
  const { data: conversationsData } = useGetConversationsQuery(undefined, {
    skip: !isAuthenticated,
    // Poll every 30 seconds to update unread count
    pollingInterval: 30000,
  });

  // Calculate total unread count from conversations
  useEffect(() => {
    if (conversationsData?.conversations) {
      const totalUnread = conversationsData.conversations.reduce((sum, conv) => {
        return sum + (conv.unreadCount || 0);
      }, 0);
      setUnreadCount(totalUnread);
    } else {
      setUnreadCount(0);
    }
  }, [conversationsData]);

  // Reset unread count when user is on messages page
  useEffect(() => {
    if (isOnMessagesPage) {
      setUnreadCount(0);
    }
  }, [isOnMessagesPage]);

  // Track login time
  useEffect(() => {
    if (isAuthenticated && user && !loginTimeRef.current) {
      loginTimeRef.current = Date.now();
    } else if (!isAuthenticated) {
      loginTimeRef.current = null;
    }
  }, [isAuthenticated, user]);

  const connectToConversation = useCallback((conversationId: string) => {
    if (!token || !user || !isAuthenticated) {
      return;
    }

    // If already connected to this conversation, do nothing
    if (wsRef.current && 
        wsRef.current.readyState === WebSocket.OPEN && 
        currentConversationIdRef.current === conversationId) {
      setIsConnected(true);
      setIsConnecting(false);
      return;
    }

    // Close existing connection if switching conversations
    if (wsRef.current && currentConversationIdRef.current && currentConversationIdRef.current !== conversationId) {
      const oldWs = wsRef.current;
      isIntentionallyClosedRef.current = true;
      
      // Close the old connection immediately
      if (oldWs.readyState === WebSocket.OPEN || oldWs.readyState === WebSocket.CONNECTING) {
        oldWs.close(1000, 'Switching conversation');
      }
      
      // Clear the old connection reference immediately
      wsRef.current = null;
      currentConversationIdRef.current = null;
      
      // Reset the flag immediately to allow new connection
      isIntentionallyClosedRef.current = false;
      
      // Continue to open new connection immediately (no delay)
    }

    // Check if already connecting to the same conversation
    if (isConnecting && currentConversationIdRef.current === conversationId) {
      return;
    }

    setIsConnecting(true);
    isIntentionallyClosedRef.current = false;
    currentConversationIdRef.current = conversationId;

    const wsUrl = `${WS_BASE_URL}/ws/chat/${conversationId}/?token=${encodeURIComponent(token)}`;

    const websocket = new WebSocket(wsUrl);

    connectionTimeoutRef.current = setTimeout(() => {
      if (websocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket connection timeout');
        websocket.close();
        setIsConnecting(false);
        setIsConnected(false);
      }
    }, 10000);

    websocket.onopen = () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      console.log('✅ Global WebSocket Connected successfully to conversation:', conversationId);
      setIsConnecting(false);
      setIsConnected(true);
      isIntentionallyClosedRef.current = false;
      reconnectAttemptsRef.current = 0;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'online_users':
            if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
              setOnlineUsers(data.onlineUsers);
              if (data.onlineUsersDetails && Array.isArray(data.onlineUsersDetails)) {
                setOnlineUsersDetails(data.onlineUsersDetails);
              }
            }
            break;

          case 'chat_message':
            if (data.message) {
              // Check if this message is for the current user and not from them
              const isMyMessage = data.message.senderId === user?.id || 
                                  data.message.isSender === true ||
                                  data.message.sender === 'me';
              
              if (!isMyMessage && data.message.receiverId === user?.id && !isOnMessagesPage) {
                // Increment unread count if user is not on messages page
                setUnreadCount(prev => prev + 1);
              }
            }
            break;

          case 'user_status':
            if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
              setOnlineUsers(data.onlineUsers);
            }
            if (data.onlineUsersDetails && Array.isArray(data.onlineUsersDetails)) {
              setOnlineUsersDetails(data.onlineUsersDetails);
            }
            break;

          default:
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onerror = (error) => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      console.error('WebSocket Error:', error);
      setIsConnecting(false);
      setIsConnected(false);
    };

    websocket.onclose = (event) => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      console.log('WebSocket closed:', event.code, event.reason);
      setIsConnecting(false);
      setIsConnected(false);

      if (isIntentionallyClosedRef.current) {
        reconnectAttemptsRef.current = 0;
        // Don't try to reconnect - we're switching conversations
        // The new connection will be established by connectToConversation
        return;
      }

      if (event.code === 4001) {
        // Authentication failed
        reconnectAttemptsRef.current = 0;
        return;
      }

      // Attempt to reconnect if we have a conversation
      if (isAuthenticated && user && token && currentConversationIdRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current += 1;
        const delay = reconnectDelay * reconnectAttemptsRef.current;
        
        console.log(`🔄 Attempting to reconnect WebSocket (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}) in ${delay}ms...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (currentConversationIdRef.current) {
            connectToConversation(currentConversationIdRef.current);
          }
        }, delay);
      }
    };

    wsRef.current = websocket;
  }, [token, user, isAuthenticated, isConnecting, isOnMessagesPage]);

  // Connect to first conversation 4-5 seconds after login (only if not on messages page)
  useEffect(() => {
    if (isAuthenticated && user && token && loginTimeRef.current && !isOnMessagesPage && conversationsData) {
      const timeSinceLogin = Date.now() - loginTimeRef.current;
      const delay = Math.max(0, 4500 - timeSinceLogin); // 4.5 seconds after login

      // Only connect if we don't already have a connection
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connectAfterLoginTimeoutRef.current = setTimeout(() => {
          const conversations = conversationsData.conversations || [];
          
          if (conversations.length > 0) {
            const firstConversation = conversations[0];
            const convId = firstConversation.conversationId || firstConversation.id;
            if (convId && (!currentConversationIdRef.current || currentConversationIdRef.current !== convId)) {
              connectToConversation(convId);
            }
          }
        }, delay);

        return () => {
          if (connectAfterLoginTimeoutRef.current) {
            clearTimeout(connectAfterLoginTimeoutRef.current);
          }
        };
      }
    }
  }, [isAuthenticated, user, token, isOnMessagesPage, connectToConversation, conversationsData]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      isIntentionallyClosedRef.current = true;
      wsRef.current.close(1000, 'Disconnecting');
      wsRef.current = null;
      currentConversationIdRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, []);

  // Disconnect on logout
  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnect();
      setUnreadCount(0);
      setOnlineUsers([]);
      setOnlineUsersDetails([]);
      loginTimeRef.current = null;
    }
  }, [isAuthenticated, user, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (connectAfterLoginTimeoutRef.current) {
        clearTimeout(connectAfterLoginTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  const value: WebSocketContextType = {
    wsRef,
    isConnected,
    isConnecting,
    unreadCount,
    onlineUsers,
    onlineUsersDetails,
    connectToConversation,
    disconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}

