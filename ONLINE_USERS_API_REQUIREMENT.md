# Online Users API Requirement

## Current Implementation

Currently, the WebSocket sends `online_users` as an array of user IDs:
```json
{
  "type": "online_users",
  "onlineUsers": ["user_id_1", "user_id_2", "user_id_3"]
}
```

## Required API Endpoint

To display online users with their names and profile pictures, we need an API endpoint that returns user details for the online user IDs.

### Recommended Endpoint

```
GET /api/chat/online-users/
```

### Response Format

```json
{
  "success": true,
  "onlineUsers": [
    {
      "id": "user_id_1",
      "username": "john_doe",
      "profileImage": "https://example.com/profile.jpg",
      "isOnline": true
    },
    {
      "id": "user_id_2",
      "username": "jane_smith",
      "profileImage": "https://example.com/profile2.jpg",
      "isOnline": true
    }
  ]
}
```

### Alternative: Include in WebSocket Message

Alternatively, the backend can include user details directly in the WebSocket `online_users` message:

```json
{
  "type": "online_users",
  "onlineUsers": [
    {
      "id": "user_id_1",
      "username": "john_doe",
      "profileImage": "https://example.com/profile.jpg"
    },
    {
      "id": "user_id_2",
      "username": "jane_smith",
      "profileImage": "https://example.com/profile2.jpg"
    }
  ]
}
```

## Frontend Implementation

Once the API is available, the frontend will:

1. **Option 1: Use API Endpoint**
   - Call `GET /api/chat/online-users/` when WebSocket connects
   - Store user details in state
   - Update when `online_users` WebSocket message is received

2. **Option 2: Use WebSocket Data**
   - If backend includes user details in WebSocket message, use them directly
   - No additional API call needed

## Current Frontend Code Location

- **WebSocket Handler**: `components/dashboard/messages/hooks/useWebSocket.ts`
  - Line 167-190: Handles `online_users` WebSocket message
  - Currently stores only user IDs in `onlineUsers` state

- **Display Components**:
  - `components/dashboard/messages/components/UsersList.tsx` - Shows online status in conversation list
  - `components/dashboard/messages/components/ChatHeader.tsx` - Shows online status in chat header

## Implementation Notes

- The frontend currently uses `onlineUsers.includes(userId)` to check if a user is online
- Once user details are available, we can display names and profile pictures
- The online status indicator (green dot) is already implemented and working

