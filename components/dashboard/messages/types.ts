export interface ProductInfo {
  id: string;
  title: string;
  image: string;
  images?: string[];
  price: number;
  originalPrice?: number;
  currency?: string;
  size?: string;
  condition?: string;
}

export interface OfferInfo {
  id: string;
  offerAmount?: number;
  offer?: number;
  originalPrice?: number;
  price?: number;
  counterAmount?: number;
  status?: 'pending' | 'accepted' | 'rejected' | 'countered';
  type?: string;
  product?: ProductInfo | string;
  productId?: string;
  shippingCost?: number;
  shipping?: number;
  expirationDate?: string;
  expires?: string;
  size?: string;
  payment?: {
    status?: 'pending' | 'paid' | 'completed' | 'failed';
  };
  paymentStatus?: 'pending' | 'paid' | 'completed' | 'failed';
}

export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string; // Formatted timestamp for display
  rawTimestamp?: string; // ISO timestamp string for sorting
  attachments?: string[];
  senderId?: string;
  receiverId?: string;
  isDelivered?: boolean;
  isRead?: boolean;
  offerId?: string;
  productId?: string;
  offer?: OfferInfo;
  messageType?: string;
}

export interface Offer {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  offerAmount: number;
  originalPrice?: number;
  counterAmount?: number;
  status: 'pending' | 'countered' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

export interface AttachedFile {
  id: string;
  file: File;
  preview: string;
}

export interface ConversationUser {
  id: string;
  conversationId: string;
  otherUser: {
    id: string;
    username: string;
    profileImage?: string;
    status?: 'active' | 'inactive' | 'offline';
    isOnline?: boolean;
  };
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: string;
  productId?: string | null;
}

