# MessagesContent Refactoring Guide

This document outlines the refactoring structure for the MessagesContent component.

## File Structure

```
components/dashboard/messages/
├── types.ts                    # Type definitions
├── utils.ts                    # Helper functions (formatUsername, formatDate, formatMessageTime)
├── ProductMessageCard.tsx      # Product offer message card component
├── hooks/
│   ├── useWebSocket.ts         # WebSocket connection and message handling
│   ├── useOffers.ts            # Offer management functions
│   └── useMessages.ts          # Messages fetching and state management (TODO)
├── components/
│   ├── UsersList.tsx           # Conversations list sidebar (TODO)
│   ├── ChatHeader.tsx          # Chat header with user info (TODO)
│   ├── ChatArea.tsx            # Messages display area (TODO)
│   └── MessageInput.tsx        # Message input form (TODO)
└── MessagesContent.tsx         # Main component (refactored to use above)

```

## Completed

1. ✅ **types.ts** - All type definitions extracted
2. ✅ **utils.ts** - Helper functions extracted
3. ✅ **ProductMessageCard.tsx** - Product message card component extracted
4. ✅ **hooks/useWebSocket.ts** - WebSocket logic extracted
5. ✅ **hooks/useOffers.ts** - Offer management functions extracted

## TODO

1. **hooks/useMessages.ts** - Extract messages fetching and state management
2. **components/UsersList.tsx** - Extract conversations list UI
3. **components/ChatHeader.tsx** - Extract chat header UI
4. **components/ChatArea.tsx** - Extract messages display area
5. **components/MessageInput.tsx** - Extract message input form
6. **MessagesContent.tsx** - Refactor main component to use all extracted pieces

## Next Steps

1. Create `useMessages.ts` hook for message fetching logic
2. Create UI components for better separation
3. Refactor main `MessagesContent.tsx` to orchestrate all pieces
4. Test all functionality to ensure nothing is broken

