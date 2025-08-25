# Shaadi Mantra API Documentation

## Overview

The Shaadi Mantra API is a RESTful service built with Node.js, Express, and MongoDB. It provides authentication, user management, matching, and chat functionality for the dating application.

## Base URL

```
Production: https://api.shaadimantra.com
Development: http://localhost:5500
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Most endpoints require a valid JWT token in the Authorization header.

### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Endpoints

### Authentication

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "verified": false,
    "profileCompleteness": 0
  },
  "message": "User registered successfully"
}
```

#### POST /api/auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "verified": true,
    "profileCompleteness": 85
  },
  "token": "jwt_token_here"
}
```

#### POST /api/auth/verify-otp
Verify OTP for account verification.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

#### POST /api/auth/resend-otp
Resend OTP to user's email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

#### POST /api/auth/logout
Logout user and invalidate token.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /api/auth/status
Get current authentication status.

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "verified": true,
    "profileCompleteness": 85
  }
}
```

### User Profile

#### GET /api/profile
Get current user's profile.

**Response:**
```json
{
  "success": true,
  "profile": {
    "_id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "gender": "male",
    "dateOfBirth": "1990-01-01",
    "profession": "Software Engineer",
    "education": "Bachelor's Degree",
    "currentResidence": "Mumbai, Maharashtra",
    "nativePlace": "Delhi, Delhi",
    "about": "I am a software engineer...",
    "interests": ["reading", "traveling"],
    "images": "https://example.com/image.jpg",
    "profileCompleteness": 85
  }
}
```

#### PUT /api/profile
Update user profile.

**Request Body:**
```json
{
  "name": "John Doe",
  "gender": "male",
  "dateOfBirth": "1990-01-01",
  "profession": "Software Engineer",
  "education": "Bachelor's Degree",
  "currentResidence": "Mumbai, Maharashtra",
  "nativePlace": "Delhi, Delhi",
  "about": "I am a software engineer...",
  "interests": ["reading", "traveling"]
}
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "_id": "user_id",
    "name": "John Doe",
    "profileCompleteness": 90
  },
  "message": "Profile updated successfully"
}
```

#### POST /api/profile/upload-image
Upload profile image.

**Request Body:**
```json
{
  "image": "base64_encoded_image_data"
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://example.com/uploaded_image.jpg",
  "message": "Image uploaded successfully"
}
```

### Matching

#### GET /api/matching/discovery
Get discovery profiles for swiping.

**Query Parameters:**
- `page` (number): Page number for pagination
- `limit` (number): Number of profiles per page
- `filters` (string): JSON string of filters

**Response:**
```json
{
  "success": true,
  "profiles": [
    {
      "_id": "profile_id",
      "profile": {
        "name": "Jane Doe",
        "age": 25,
        "gender": "female",
        "profession": "Doctor",
        "education": "MBBS",
        "currentResidence": "Bangalore, Karnataka",
        "nativePlace": "Chennai, Tamil Nadu",
        "about": "I am a doctor...",
        "interests": ["medicine", "yoga"],
        "images": "https://example.com/jane.jpg"
      },
      "verification": {
        "isVerified": true
      }
    }
  ],
  "dailyLimitReached": false,
  "dailyLikeCount": 5,
  "remainingLikes": 15
}
```

#### POST /api/matching/like
Like a profile.

**Request Body:**
```json
{
  "targetUserId": "profile_id",
  "type": "like"
}
```

**Response:**
```json
{
  "success": true,
  "isMutualMatch": true,
  "connection": {
    "_id": "connection_id",
    "participants": ["user_id", "profile_id"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "dailyLikeCount": 6,
  "remainingLikes": 14,
  "shouldShowToast": true
}
```

#### POST /api/matching/pass
Pass on a profile.

**Request Body:**
```json
{
  "targetUserId": "profile_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile passed"
}
```

#### GET /api/matching/matches
Get user's matches.

**Response:**
```json
{
  "success": true,
  "matches": [
    {
      "connectionId": "connection_id",
      "profile": {
        "_id": "profile_id",
        "name": "Jane Doe",
        "age": 25,
        "gender": "female",
        "profession": "Doctor",
        "images": "https://example.com/jane.jpg"
      },
      "matchDate": "2024-01-01T00:00:00.000Z",
      "lastActivity": "2024-01-01T00:00:00.000Z"
    }
  ],
  "totalMatches": 1
}
```

#### GET /api/matching/liked
Get profiles liked by user.

**Response:**
```json
{
  "success": true,
  "likedProfiles": [
    {
      "likeId": "like_id",
      "profile": {
        "_id": "profile_id",
        "name": "Jane Doe",
        "age": 25,
        "gender": "female",
        "profession": "Doctor",
        "images": "https://example.com/jane.jpg"
      },
      "likeDate": "2024-01-01T00:00:00.000Z",
      "type": "like",
      "isMutualMatch": false
    }
  ],
  "totalLikes": 1,
  "mutualMatches": 0
}
```

#### POST /api/matching/mark-toast-seen
Mark match toast as seen.

**Request Body:**
```json
{
  "targetUserId": "profile_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Toast marked as seen"
}
```

#### POST /api/matching/mark-toast-seen-chat
Mark match toast as seen when entering chat.

**Request Body:**
```json
{
  "connectionId": "connection_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Toast marked as seen"
}
```

### Chat

#### GET /api/chat/connections
Get user's chat connections.

**Response:**
```json
{
  "success": true,
  "connections": [
    {
      "_id": "connection_id",
      "participants": ["user_id", "profile_id"],
      "lastMessage": {
        "content": "Hello!",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "senderId": "user_id"
      },
      "unreadCount": 2
    }
  ]
}
```

#### GET /api/chat/:connectionId/messages
Get messages for a specific connection.

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "_id": "message_id",
      "senderId": "user_id",
      "receiverId": "profile_id",
      "content": "Hello! How are you?",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "isRead": false
    }
  ],
  "connection": {
    "_id": "connection_id",
    "participants": ["user_id", "profile_id"]
  }
}
```

#### POST /api/chat/:connectionId/messages
Send a message.

**Request Body:**
```json
{
  "content": "Hello! How are you?"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "_id": "message_id",
    "senderId": "user_id",
    "receiverId": "profile_id",
    "content": "Hello! How are you?",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "isRead": false
  }
}
```

#### POST /api/chat/:connectionId/read
Mark messages as read.

**Response:**
```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

### Admin

#### GET /api/admin/users
Get all users (admin only).

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Number of users per page
- `search` (string): Search term
- `status` (string): Filter by status

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "verified": true,
      "profileCompleteness": 85,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "totalUsers": 100,
  "currentPage": 1,
  "totalPages": 10
}
```

#### POST /api/admin/users/:userId/verify
Verify a user (admin only).

**Response:**
```json
{
  "success": true,
  "message": "User verified successfully"
}
```

#### DELETE /api/admin/users/:userId
Delete a user (admin only).

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### GET /api/admin/stats
Get admin statistics (admin only).

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 1000,
    "verifiedUsers": 850,
    "totalMatches": 500,
    "totalMessages": 2000,
    "activeUsers": 150,
    "newUsersToday": 25
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error message",
  "details": {
    "field": "error message"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **Profile endpoints**: 100 requests per minute
- **Matching endpoints**: 50 requests per minute
- **Chat endpoints**: 200 requests per minute
- **Admin endpoints**: 30 requests per minute

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)

**Response Format:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## File Upload

For file uploads (profile images), use multipart/form-data:

```
Content-Type: multipart/form-data

Form fields:
- image: File (max 5MB, formats: jpg, png, webp)
```

## WebSocket Events

For real-time chat functionality, the API supports WebSocket connections:

### Connection
```
ws://localhost:5500/ws
```

### Events

#### Send Message
```json
{
  "type": "send_message",
  "data": {
    "connectionId": "connection_id",
    "content": "Hello!"
  }
}
```

#### Receive Message
```json
{
  "type": "new_message",
  "data": {
    "_id": "message_id",
    "senderId": "user_id",
    "receiverId": "profile_id",
    "content": "Hello!",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### User Online/Offline
```json
{
  "type": "user_status",
  "data": {
    "userId": "user_id",
    "status": "online" // or "offline"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```javascript
class ShaadiMantraAPI {
  constructor(baseURL = 'https://api.shaadimantra.com') {
    this.baseURL = baseURL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  // Authentication
  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(data.token);
    return data;
  }

  // Profile
  async getProfile() {
    return this.request('/api/profile');
  }

  async updateProfile(profileData) {
    return this.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Matching
  async getDiscoveryProfiles(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/matching/discovery?${params}`);
  }

  async likeProfile(targetUserId) {
    return this.request('/api/matching/like', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  }

  // Chat
  async getMessages(connectionId) {
    return this.request(`/api/chat/${connectionId}/messages`);
  }

  async sendMessage(connectionId, content) {
    return this.request(`/api/chat/${connectionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }
}

// Usage
const api = new ShaadiMantraAPI();

// Register and login
const user = await api.register({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
});

await api.login({
  email: 'user@example.com',
  password: 'password123',
});

// Get discovery profiles
const profiles = await api.getDiscoveryProfiles();

// Like a profile
const match = await api.likeProfile(profiles.profiles[0]._id);

// Send a message
await api.sendMessage(match.connection._id, 'Hello!');
```

## Support

For API support and questions:

- **Email**: api-support@shaadimantra.com
- **Documentation**: https://docs.shaadimantra.com
- **Status Page**: https://status.shaadimantra.com 