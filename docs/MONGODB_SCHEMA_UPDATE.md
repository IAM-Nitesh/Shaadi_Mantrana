# MongoDB Schema Update - Chat Implementation

## 📋 Overview

This document outlines the updated MongoDB schemas for the chat implementation, including DailyLike, Conversation, and Match models based on actual database structures.

## 🗄️ Updated Schema Models

### 1. DailyLike Model (`DailyLike.js`)

**Purpose**: Track daily likes and mutual matches with toast notification tracking.

**Key Fields**:
- `userId`: User who performed the like action
- `likedProfileId`: Profile that was liked
- `likeDate`: Date when the like was made
- `type`: Type of like action (`like`, `super_like`, `pass`)
- `isMutualMatch`: Whether this resulted in a mutual match
- `connectionId`: Connection ID if a match was created
- `toastSeen`: Map tracking toast notification status per user

**Indexes**:
- `{ userId: 1 }`
- `{ likedProfileId: 1 }`
- `{ connectionId: 1 }`
- `{ userId: 1, likedProfileId: 1 }` (unique)

**Key Methods**:
- `getUserDailyLikes(userId, date)` - Get user's daily likes
- `hasLikedToday(userId, profileId)` - Check if user liked profile today
- `getMutualMatches(userId)` - Get user's mutual matches
- `markToastSeen(userId, connectionId)` - Mark toast as seen

### 2. Conversation Model (`Conversation.js`)

**Purpose**: Store chat conversations with embedded messages.

**Key Fields**:
- `connectionId`: Connection ID that this conversation belongs to
- `participants`: Array of user IDs in the conversation
- `messages`: Array of embedded message objects
- `messageCount`: Quick access to message count
- `lastMessageAt`: Timestamp of last message
- `status`: Conversation status (`active`, `archived`, `blocked`)

**Message Sub-Schema**:
- `id`: Unique message identifier
- `senderId`: User who sent the message
- `content`: Message content (max 1000 chars)
- `type`: Message type (`text`, `image`, `emoji`, `file`)
- `status`: Message status (`sending`, `sent`, `delivered`, `read`, `failed`)
- `timestamp`: Message timestamp
- `ipAddress`: IP address of sender
- `userAgent`: User agent of sender
- `isEncrypted`: Whether message is encrypted
- `readBy`: Array of users who have read the message

**Indexes**:
- `{ connectionId: 1 }` (unique)
- `{ participants: 1 }`
- `{ lastMessageAt: -1 }`
- `{ participants: 1, lastMessageAt: -1 }`

**Key Methods**:
- `findByConnectionId(connectionId)` - Find conversation by connection ID
- `findUserConversations(userId, status)` - Get user's conversations
- `addMessage(connectionId, messageData)` - Add message to conversation
- `markAsRead(connectionId, userId)` - Mark messages as read
- `getUnreadCount(connectionId, userId)` - Get unread message count

### 3. Match Model (`Match.js`)

**Purpose**: Track matches between users with toast notification tracking.

**Key Fields**:
- `users`: Array of user IDs in the match
- `connectionId`: Connection ID for this match
- `status`: Match status (`active`, `inactive`, `blocked`, `expired`)
- `matchDate`: Date when the match was created
- `toastSeen`: Map tracking toast notification status per user
- `metadata`: Match metadata (initiatedBy, matchType, source, platform)
- `compatibility`: Compatibility score and factors

**Indexes**:
- `{ users: 1 }`
- `{ connectionId: 1 }` (unique)
- `{ status: 1 }`
- `{ matchDate: -1 }`
- `{ users: 1, status: 1 }`

**Key Methods**:
- `findByConnectionId(connectionId)` - Find match by connection ID
- `findUserMatches(userId, status)` - Get user's matches
- `existsBetweenUsers(userId1, userId2)` - Check if match exists
- `createMatch(userId1, userId2, connectionId, initiatedBy)` - Create new match
- `markToastSeen(userId, connectionId)` - Mark toast as seen

## 💬 Chat Implementation Status

### Backend Implementation ✅

**Chat Controller** (`chatControllerMongo.js`):
- ✅ `getChatMessages()` - Fetch messages from Conversation model
- ✅ `sendMessage()` - Save messages to Conversation model
- ✅ `markAsRead()` - Update message read status
- ✅ `getUserConversations()` - Get user's conversation list

**Chat Routes** (`chatRoutes.js`):
- ✅ `GET /api/chat/conversations` - Get user conversations
- ✅ `GET /api/chat/:connectionId` - Get chat messages
- ✅ `POST /api/chat/:connectionId` - Send message
- ✅ `PUT /api/chat/:connectionId/read` - Mark as read

**Socket.IO Service** (`chatService.js`):
- ✅ Real-time message broadcasting
- ✅ Room management
- ✅ Typing indicators
- ⚠️ Needs MongoDB integration for message persistence

### Frontend Implementation ✅

**Chat UI** (`ChatComponent.tsx`):
- ✅ Beautiful, modern chat interface
- ✅ Real-time message display with animations
- ✅ Message status indicators
- ✅ Typing indicators
- ✅ Responsive design

**Chat Service** (`chat-service.ts`):
- ✅ API integration with backend
- ✅ Caching system for performance
- ✅ Authentication handling
- ✅ Error management

## 🔄 Database Integration

### Message Persistence
- Messages are now stored in MongoDB using the Conversation model
- Each message includes sender info, content, timestamp, and metadata
- Read status tracking with user-specific timestamps
- IP address and user agent logging for security

### Toast Notification Tracking
- Both DailyLike and Match models include `toastSeen` Map
- Prevents duplicate match notifications
- User-specific tracking across sessions
- Automatic marking as seen after displaying

### Connection Management
- Connection model links users and manages relationship status
- Conversation model stores actual chat messages
- Match model tracks successful matches
- DailyLike model tracks individual like actions

## 🚀 Next Steps

### Immediate Tasks
1. **Socket.IO Integration**: Connect real-time service with MongoDB
2. **Message Encryption**: Implement end-to-end encryption
3. **File Upload**: Add support for image/file messages
4. **Push Notifications**: Implement push notifications for new messages

### Performance Optimizations
1. **Message Pagination**: Implement pagination for large conversations
2. **Message Search**: Add search functionality within conversations
3. **Message Reactions**: Add emoji reactions to messages
4. **Message Editing**: Allow users to edit/delete messages

### Security Enhancements
1. **Message Encryption**: Implement message encryption
2. **Rate Limiting**: Add rate limiting for message sending
3. **Content Moderation**: Add content filtering
4. **Audit Logging**: Enhanced logging for security monitoring

## 📊 Schema Relationships

```
User
├── DailyLike (likes given)
├── Match (matches)
├── Connection (connections)
└── Conversation (participant)

Connection
├── Conversation (1:1)
└── Match (1:1)

DailyLike
├── User (liker)
├── User (liked profile)
└── Connection (if match created)

Match
├── Users (2 participants)
└── Connection (1:1)

Conversation
├── Participants (2 users)
├── Messages (embedded)
└── Connection (1:1)
```

## 🔧 Migration Notes

### Existing Data Compatibility
- DailyLike model updated to include `connectionId` and `toastSeen`
- Match model restructured to use `users` array instead of individual fields
- Conversation model is new and will be created automatically
- All existing indexes maintained for backward compatibility

### Data Migration
- Existing likes will need `connectionId` field populated
- Existing matches will need to be restructured to use `users` array
- Toast tracking will be initialized as `false` for existing records

## 📈 Performance Considerations

### Indexing Strategy
- Compound indexes for common query patterns
- Unique indexes for data integrity
- Sparse indexes for optional fields

### Query Optimization
- Embedded messages reduce join operations
- Message count caching for quick access
- Last message timestamp for sorting

### Storage Optimization
- Message content limited to 1000 characters
- Automatic cleanup of old messages (24 hours)
- Efficient timestamp storage

This implementation provides a robust, scalable chat system with proper data persistence, real-time capabilities, and comprehensive tracking of user interactions. 