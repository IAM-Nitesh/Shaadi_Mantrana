# ShaadiMantra API Controller Documentation

## Table of Contents
1. [Authentication Controller](#authentication-controller)
2. [Profile Controller](#profile-controller)  
3. [Upload Controller](#upload-controller)
4. [Invitation Controller](#invitation-controller)
5. [Global Error Handling](#global-error-handling)
6. [JWT Token System](#jwt-token-system)
7. [Production Best Practices](#production-best-practices)

---

## Authentication Controller (`authControllerMongo.js`)

### Overview
Handles user authentication with JWT tokens and UUID tracking. **No OTP storage** - generates OTPs for external services only.

### Base URL
`/api/auth`

### Security Features
- JWT tokens with UUID payload
- Request rate limiting
- Input validation and sanitization
- XSS protection
- No sensitive data storage

---

### 1. Send OTP
**Endpoint:** `POST /send-otp`

**Purpose:** Generate OTP for user verification (not stored in database)

#### Request Payload
```json
{
  "email": "user@example.com"
}
```

#### Request Validation
```javascript
{
  email: {
    type: "string",
    required: true,
    format: "email",
    maxLength: 254,
    sanitized: true
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "requestId": "req_uuid_12345",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    // Development mode only
    "otp": "123456" // Only in NODE_ENV=development
  }
}
```

#### Error Responses

**400 - Validation Error**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "email format is invalid",
  "field": "email",
  "requestId": "req_uuid_12345",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**429 - Rate Limit**
```json
{
  "success": false,
  "error": "RATE_LIMIT_ERROR",
  "message": "Too many OTP requests. Please try again later",
  "retryAfter": 300,
  "requestId": "req_uuid_12345"
}
```

**500 - External Service Error**
```json
{
  "success": false,
  "error": "EXTERNAL_SERVICE_ERROR",
  "message": "Failed to send OTP",
  "requestId": "req_uuid_12345"
}
```

#### Implementation Details
- OTP generation: 6-digit random number
- External service integration point (SMS/Email provider)
- No database storage of OTP
- Automatic cleanup of generated OTP after 5 minutes
- Logging with user email and request UUID

---

### 2. Verify OTP
**Endpoint:** `POST /verify-otp`

**Purpose:** Verify OTP and create/login user with JWT token

#### Request Payload
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### Request Validation
```javascript
{
  email: {
    type: "string", 
    required: true,
    format: "email",
    maxLength: 254
  },
  otp: {
    type: "string",
    required: true,
    pattern: /^\d{6}$/,
    length: 6
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Login successful",
  "requestId": "req_uuid_12345",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userUuid": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": null,
      "age": null,
      "interests": [],
      "images": [],
      "isProfileComplete": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### JWT Token Structure
```javascript
{
  "userId": "507f1f77bcf86cd799439011", // MongoDB ObjectId
  "userUuid": "550e8400-e29b-41d4-a716-446655440000", // UUID v4
  "email": "user@example.com",
  "iat": 1642248600, // Issued at timestamp
  "exp": 1642335000  // Expiry timestamp (24 hours)
}
```

#### Error Responses

**400 - Invalid OTP**
```json
{
  "success": false,
  "error": "AUTHENTICATION_ERROR",
  "message": "Invalid or expired OTP",
  "field": "otp",
  "requestId": "req_uuid_12345"
}
```

**404 - User Creation Failed**
```json
{
  "success": false,
  "error": "DATABASE_ERROR", 
  "message": "Failed to create user account",
  "requestId": "req_uuid_12345"
}
```

#### JWT Token Details
- **Algorithm:** HS256
- **Expiry:** 24 hours
- **Payload:** userId, userUuid, email, iat, exp
- **Secret:** Environment variable `JWT_SECRET`
- **Header:** `Authorization: Bearer <token>`

#### Implementation Details
- External OTP verification service integration
- Automatic user creation if email doesn't exist
- UUID generation for new users
- JWT token creation with user UUID
- Request logging with correlation ID

---

### 3. Refresh Token
**Endpoint:** `POST /refresh-token`

**Purpose:** Refresh JWT token for authenticated users

#### Request Headers
```
Authorization: Bearer <current_jwt_token>
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "requestId": "req_uuid_12345",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2024-01-16T10:30:00.000Z"
  }
}
```

#### Error Responses

**401 - Invalid Token**
```json
{
  "success": false,
  "error": "AUTHENTICATION_ERROR",
  "message": "Invalid or expired token",
  "requestId": "req_uuid_12345"
}
```

---

## Profile Controller (`profileController.js`)

### Overview
Manages user profile operations with comprehensive validation and image handling.

### Base URL
`/api/profile`

### Authentication Required
All endpoints require valid JWT token in Authorization header.

---

### 1. Get Profile
**Endpoint:** `GET /`

**Purpose:** Retrieve current user's profile

#### Request Headers
```
Authorization: Bearer <jwt_token>
X-User-UUID: <user_uuid> // Automatically added by middleware
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Profile retrieved successfully", 
  "requestId": "req_uuid_12345",
  "userUuid": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "userUuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "age": 28,
    "interests": ["traveling", "photography", "cooking"],
    "images": [
      "/uploads/profiles/550e8400-e29b-41d4-a716-446655440000/image1.jpg",
      "/uploads/profiles/550e8400-e29b-41d4-a716-446655440000/image2.jpg"
    ],
    "isProfileComplete": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

#### Error Responses

**401 - Unauthorized**
```json
{
  "success": false,
  "error": "AUTHENTICATION_ERROR",
  "message": "Invalid or missing authentication token",
  "requestId": "req_uuid_12345"
}
```

**404 - Profile Not Found**
```json
{
  "success": false,
  "error": "NOT_FOUND_ERROR",
  "message": "User profile not found",
  "requestId": "req_uuid_12345"
}
```

---

### 2. Update Profile
**Endpoint:** `PUT /`

**Purpose:** Update user profile information

#### Request Payload
```json
{
  "name": "John Doe",
  "age": 28,
  "interests": ["traveling", "photography", "cooking"]
}
```

#### Request Validation
```javascript
{
  name: {
    type: "string",
    required: false,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    sanitized: true
  },
  age: {
    type: "number",
    required: false,
    min: 18,
    max: 80,
    integer: true
  },
  interests: {
    type: "array",
    required: false,
    maxLength: 10,
    itemValidation: {
      type: "string",
      maxLength: 50,
      sanitized: true
    }
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "requestId": "req_uuid_12345",
  "userUuid": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "userUuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com", 
    "name": "John Doe",
    "age": 28,
    "interests": ["traveling", "photography", "cooking"],
    "images": [...],
    "isProfileComplete": true,
    "updatedAt": "2024-01-15T12:30:00.000Z"
  }
}
```

#### Error Responses

**400 - Validation Error**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "age must be between 18 and 80",
  "field": "age",
  "value": 15,
  "requestId": "req_uuid_12345"
}
```

---

### 3. Upload Profile Image
**Endpoint:** `POST /upload-image`

**Purpose:** Upload profile images with validation

#### Request Format
`Content-Type: multipart/form-data`

#### Request Body
```
image: <file> // Image file (max 5MB, jpg/png/jpeg)
```

#### File Validation
```javascript
{
  fileSize: "max 5MB",
  allowedTypes: ["image/jpeg", "image/png", "image/jpg"],
  maxFiles: 5,
  naming: "uuid-timestamp-original",
  storage: "/uploads/profiles/{userUuid}/"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "requestId": "req_uuid_12345",
  "userUuid": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "imageUrl": "/uploads/profiles/550e8400-e29b-41d4-a716-446655440000/image_1642248600.jpg",
    "totalImages": 3
  }
}
```

#### Error Responses

**400 - Invalid File**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "File type not allowed. Only JPG, PNG, JPEG are supported",
  "field": "image",
  "requestId": "req_uuid_12345"
}
```

**413 - File Too Large**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "File size exceeds 5MB limit",
  "field": "image",
  "requestId": "req_uuid_12345"
}
```

**409 - Too Many Images**
```json
{
  "success": false,
  "error": "CONFLICT_ERROR", 
  "message": "Maximum 5 images allowed per profile",
  "requestId": "req_uuid_12345"
}
```

---

### 4. Delete Profile Image
**Endpoint:** `DELETE /image`

**Purpose:** Remove specific profile image

#### Request Payload
```json
{
  "imageUrl": "/uploads/profiles/550e8400-e29b-41d4-a716-446655440000/image_1642248600.jpg"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Image deleted successfully",
  "requestId": "req_uuid_12345",
  "userUuid": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "deletedImage": "/uploads/profiles/550e8400-e29b-41d4-a716-446655440000/image_1642248600.jpg",
    "remainingImages": 2
  }
}
```

---

## Chat Controller (`chatController.js`)

### Overview
Handles messaging between matched users with real-time capabilities.

### Base URL
`/api/chat`

### Authentication Required
All endpoints require valid JWT token.

---

### 1. Get Chat Messages
**Endpoint:** `GET /:chatId/messages`

**Purpose:** Retrieve messages for a specific chat

#### Path Parameters
```
chatId: string (required) - Chat room identifier
```

#### Query Parameters
```
page: number (optional, default: 1) - Page number for pagination
limit: number (optional, default: 20, max: 100) - Messages per page
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Messages retrieved successfully",
  "requestId": "req_uuid_12345",
  "userUuid": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "messages": [
      {
        "messageId": "msg_uuid_12345",
        "chatId": "chat_uuid_67890",
        "senderUuid": "550e8400-e29b-41d4-a716-446655440000",
        "receiverUuid": "550e8400-e29b-41d4-a716-446655440001",
        "content": "Hello! How are you?",
        "timestamp": "2024-01-15T12:30:00.000Z",
        "isRead": false,
        "messageType": "text"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalMessages": 98,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "chatInfo": {
      "chatId": "chat_uuid_67890",
      "participants": [
        "550e8400-e29b-41d4-a716-446655440000",
        "550e8400-e29b-41d4-a716-446655440001"
      ],
      "lastActivity": "2024-01-15T12:30:00.000Z"
    }
  }
}
```

#### Error Responses

**403 - Unauthorized Access**
```json
{
  "success": false,
  "error": "AUTHORIZATION_ERROR",
  "message": "You are not authorized to access this chat",
  "requestId": "req_uuid_12345"
}
```

**404 - Chat Not Found**
```json
{
  "success": false,
  "error": "NOT_FOUND_ERROR",
  "message": "Chat not found",
  "requestId": "req_uuid_12345"
}
```

---

### 2. Send Message
**Endpoint:** `POST /:chatId/messages`

**Purpose:** Send a new message in chat

#### Path Parameters
```
chatId: string (required) - Chat room identifier
```

#### Request Payload
```json
{
  "content": "Hello! How are you?",
  "messageType": "text"
}
```

#### Request Validation
```javascript
{
  content: {
    type: "string",
    required: true,
    minLength: 1,
    maxLength: 1000,
    sanitized: true
  },
  messageType: {
    type: "string",
    required: false,
    enum: ["text", "image", "emoji"],
    default: "text"
  }
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Message sent successfully",
  "requestId": "req_uuid_12345",
  "userUuid": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "message": {
      "messageId": "msg_uuid_12345",
      "chatId": "chat_uuid_67890",
      "senderUuid": "550e8400-e29b-41d4-a716-446655440000",
      "receiverUuid": "550e8400-e29b-41d4-a716-446655440001",
      "content": "Hello! How are you?",
      "timestamp": "2024-01-15T12:30:00.000Z",
      "messageType": "text",
      "isDelivered": true
    }
  }
}
```

#### Error Responses

**400 - Message Too Long**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "content must be at most 1000 characters",
  "field": "content",
  "requestId": "req_uuid_12345"
}
```

**429 - Rate Limited**
```json
{
  "success": false,
  "error": "RATE_LIMIT_ERROR",
  "message": "Too many messages sent. Please wait before sending another",
  "retryAfter": 60,
  "requestId": "req_uuid_12345"
}
```

---

### 3. Mark Messages as Read
**Endpoint:** `PUT /:chatId/mark-read`

**Purpose:** Mark messages as read by current user

#### Success Response (200)
```json
{
  "success": true,
  "message": "Messages marked as read",
  "requestId": "req_uuid_12345",
  "userUuid": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "markedCount": 5,
    "lastReadTimestamp": "2024-01-15T12:30:00.000Z"
  }
}
```

---

## Match Controller (`matchController.js`)

### Overview
Handles user discovery, matching, and compatibility features.

### Base URL
`/api/matches`

### Authentication Required
All endpoints require valid JWT token.

---

### 1. Get Potential Matches
**Endpoint:** `GET /potential`

**Purpose:** Get list of potential matches for current user

#### Query Parameters
```
page: number (optional, default: 1)
limit: number (optional, default: 10, max: 50)
ageMin: number (optional, min: 18)
ageMax: number (optional, max: 80)
interests: string[] (optional) - Comma separated interests
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Potential matches retrieved successfully",
  "requestId": "req_uuid_12345",
  "userUuid": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "matches": [
      {
        "userUuid": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Jane Smith",
        "age": 26,
        "images": ["/uploads/profiles/550e8400-e29b-41d4-a716-446655440001/image1.jpg"],
        "interests": ["traveling", "reading", "yoga"],
        "compatibilityScore": 85,
        "mutualInterests": ["traveling"],
        "lastActive": "2024-01-15T11:00:00.000Z",
        "distance": 12.5
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 8,
      "totalMatches": 156,
      "hasNextPage": true
    }
  }
}
```

#### Error Responses

**400 - Invalid Filters**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "ageMin must be less than ageMax",
  "field": "ageMin",
  "requestId": "req_uuid_12345"
}
```

---

### 2. Like/Dislike User
**Endpoint:** `POST /action`

**Purpose:** Like or dislike a potential match

#### Request Payload
```json
{
  "targetUserUuid": "550e8400-e29b-41d4-a716-446655440001",
  "action": "like"
}
```

#### Request Validation
```javascript
{
  targetUserUuid: {
    type: "string",
    required: true,
    format: "uuid"
  },
  action: {
    type: "string",
    required: true,
    enum: ["like", "dislike", "super_like"]
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Action recorded successfully",
  "requestId": "req_uuid_12345",
  "userUuid": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "action": "like",
    "targetUserUuid": "550e8400-e29b-41d4-a716-446655440001",
    "isMatch": true,
    "matchedAt": "2024-01-15T12:30:00.000Z",
    "chatId": "chat_uuid_67890"
  }
}
```

#### Match Response (if mutual like)
```json
{
  "success": true,
  "message": "It's a match! 🎉",
  "requestId": "req_uuid_12345", 
  "userUuid": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "action": "like",
    "targetUserUuid": "550e8400-e29b-41d4-a716-446655440001",
    "isMatch": true,
    "matchedAt": "2024-01-15T12:30:00.000Z",
    "chatId": "chat_uuid_67890",
    "matchedUser": {
      "userUuid": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Jane Smith",
      "age": 26,
      "images": ["/uploads/profiles/550e8400-e29b-41d4-a716-446655440001/image1.jpg"]
    }
  }
}
```

#### Error Responses

**404 - User Not Found**
```json
{
  "success": false,
  "error": "NOT_FOUND_ERROR",
  "message": "Target user not found",
  "requestId": "req_uuid_12345"
}
```

**409 - Already Actioned**
```json
{
  "success": false,
  "error": "CONFLICT_ERROR",
  "message": "You have already performed an action on this user",
  "requestId": "req_uuid_12345"
}
```

---

### 3. Get My Matches
**Endpoint:** `GET /my-matches`

**Purpose:** Get list of confirmed matches for current user

#### Success Response (200)
```json
{
  "success": true,
  "message": "Matches retrieved successfully",
  "requestId": "req_uuid_12345",
  "userUuid": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "matches": [
      {
        "matchId": "match_uuid_12345",
        "userUuid": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Jane Smith",
        "age": 26,
        "images": ["/uploads/profiles/550e8400-e29b-41d4-a716-446655440001/image1.jpg"],
        "matchedAt": "2024-01-15T10:30:00.000Z",
        "chatId": "chat_uuid_67890",
        "lastMessage": {
          "content": "Hello! How are you?",
          "timestamp": "2024-01-15T12:00:00.000Z",
          "isRead": false
        },
        "unreadCount": 3
      }
    ],
    "totalMatches": 12
  }
}
```

---

## Global Error Handling

### Error Response Format
All error responses follow this consistent structure:

```json
{
  "success": false,
  "error": "ERROR_TYPE",
  "message": "Human readable error message",
  "field": "fieldName", // For validation errors
  "value": "invalidValue", // For validation errors  
  "requestId": "req_uuid_12345",
  "timestamp": "2024-01-15T12:30:00.000Z",
  "userUuid": "550e8400-e29b-41d4-a716-446655440000" // If authenticated
}
```

### Error Types

| Error Type | HTTP Status | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `AUTHENTICATION_ERROR` | 401 | Invalid or missing authentication |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND_ERROR` | 404 | Resource not found |
| `CONFLICT_ERROR` | 409 | Resource conflict |
| `RATE_LIMIT_ERROR` | 429 | Rate limit exceeded |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `EXTERNAL_SERVICE_ERROR` | 503 | External service unavailable |

### Error Logging
All errors are logged with:
- Request ID for correlation
- User UUID (if authenticated)
- Timestamp
- Stack trace (in development)
- Request details (method, path, IP)

---

## Production Best Practices

### Security Implementation

#### 1. Input Validation & Sanitization
```javascript
// All inputs validated using ValidationUtils
const validatedData = {
  email: ValidationUtils.validateEmail(req.body.email),
  name: ValidationUtils.validateString(req.body.name, 'name', {
    maxLength: 50,
    sanitized: true
  })
};
```

#### 2. JWT Security
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Secret:** 256-bit random secret from environment
- **Expiry:** 24 hours
- **Refresh:** Automatic token refresh endpoint
- **Payload:** Minimal data (userId, userUuid, email)

#### 3. Rate Limiting
```javascript
// Per endpoint rate limits
{
  "/auth/send-otp": "5 requests per 15 minutes per IP",
  "/auth/verify-otp": "10 requests per 15 minutes per IP", 
  "/chat/:chatId/messages": "60 requests per minute per user",
  "/matches/action": "100 requests per hour per user"
}
```

#### 4. XSS Protection
- Input sanitization removes `<>\"'&` characters
- Content Security Policy headers
- Output encoding for all responses

#### 5. CORS Configuration
```javascript
{
  origin: [process.env.FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-UUID']
}
```

### Data Encryption

#### 1. Password Security
- No passwords stored (OTP-based authentication)
- OTPs never stored in database
- External OTP service integration

#### 2. Sensitive Data Handling
- Email addresses stored in lowercase
- User UUIDs for public identification
- MongoDB ObjectIds kept internal

#### 3. File Security
- Image uploads validated for type/size
- Files stored with UUID-based names
- Directory traversal protection

### Database Best Practices

#### 1. Connection Security
```javascript
{
  ssl: true,
  authSource: 'admin',
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000
}
```

#### 2. Schema Validation
- Mongoose schema validation
- Custom validation methods
- Index optimization for queries

#### 3. Data Consistency
- Atomic operations for critical updates
- Transaction support for multi-document operations
- Proper error handling and rollback

### Monitoring & Logging

#### 1. Request Logging
```javascript
{
  requestId: "req_uuid_12345",
  userUuid: "550e8400-e29b-41d4-a716-446655440000",
  method: "POST",
  path: "/api/auth/verify-otp",
  ip: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  startTime: "2024-01-15T12:30:00.000Z",
  endTime: "2024-01-15T12:30:01.500Z",
  duration: 1500,
  statusCode: 200
}
```

#### 2. Error Tracking
- Structured error logging
- Error correlation with request IDs
- Stack traces in development only
- Performance metrics

#### 3. Health Monitoring
- Database connection health
- External service availability
- Memory and CPU usage
- Request/response times

### Performance Optimization

#### 1. Caching Strategy
- JWT token validation caching
- User profile caching (Redis ready)
- Static file caching headers

#### 2. Database Optimization
- Efficient indexing strategy
- Query optimization
- Connection pooling
- Read/write splitting ready

#### 3. API Optimization
- Pagination for large datasets
- Field selection for responses
- Compression for responses
- CDN integration for images

### Deployment Configuration

#### 1. Environment Variables
```bash
# Required Production Variables
NODE_ENV=production
JWT_SECRET=<256-bit-random-secret>
MONGODB_URI=<mongodb-atlas-connection-string>
PORT=3000

# Optional Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=5242880
CORS_ORIGIN=https://yourdomain.com
```

#### 2. Security Headers
```javascript
{
  "Content-Security-Policy": "default-src 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff", 
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
}
```

#### 3. Production Checklist
- ✅ Environment variables configured
- ✅ HTTPS enabled
- ✅ Rate limiting active
- ✅ Error handling comprehensive
- ✅ Logging configured
- ✅ Database indexes created
- ✅ Security headers set
- ✅ CORS properly configured
- ✅ File upload limits enforced
- ✅ Input validation comprehensive

---

## API Testing Examples

### Authentication Flow Test
```bash
# 1. Send OTP
curl -X POST https://api.shaadimantra.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 2. Verify OTP & Get Token
curl -X POST https://api.shaadimantra.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'

# 3. Use Token for Protected Endpoints
curl -X GET https://api.shaadimantra.com/api/profile \
  -H "Authorization: Bearer <jwt_token>"
```

### Error Testing
```bash
# Invalid email format
curl -X POST https://api.shaadimantra.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email"}'

# Missing required fields
curl -X PUT https://api.shaadimantra.com/api/profile \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

This documentation ensures your ShaadiMantra API is production-ready with comprehensive error handling, security best practices, and detailed specifications for all controllers.
