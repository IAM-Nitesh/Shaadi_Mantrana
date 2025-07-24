# Shaadi Mantra Controller Documentation (2024)

---

## Auth Controller (`/api/auth`)

### **POST /api/auth/send-otp**
- **Description:** Send OTP to a pre-approved email. Handles static/demo/dev/prod modes.
- **Body:** `{ email: string }`
- **Validation:**
  - Email format, length, and approval status
  - Rate limiting (per IP and per email)
  - Static mode returns demo OTP (`123456`)
  - Dev/prod mode sends real OTP via email (SMTP must be enabled)
- **Errors:**
  - 400: Invalid input, not pre-approved, or rate limit exceeded
  - 403: Email not approved
  - 429: Too many requests
  - 500: Internal/server/email errors

### **POST /api/auth/verify-otp**
- **Description:** Verify OTP and create JWT session
- **Body:** `{ email: string, otp: string }`
- **Validation:**
  - OTP format, expiration, and attempt limits
  - Email approval re-check
- **Returns:**
  - JWT access/refresh tokens, user info
- **Errors:**
  - 400: Invalid OTP, expired, or too many attempts
  - 403: Email approval revoked
  - 500: Internal/server errors

### **POST /api/auth/logout**
- **Description:** Revoke JWT session
- **Headers:** `Authorization: Bearer <token>`
- **Returns:** Success message

### **POST /api/auth/refresh-token**
- **Description:** Refresh JWT access token
- **Body:** `{ refreshToken: string }`
- **Validation:**
  - Rate limiting per IP
- **Returns:** New access token

### **GET /api/auth/profile**
- **Description:** Get authenticated user profile and session info
- **Headers:** `Authorization: Bearer <token>`
- **Returns:** User info, approval status, session stats

---

## Profile Controller (`/api/profiles`)

### **GET /api/profiles**
- **Description:** List profiles with filtering, sorting, and pagination
- **Query Params:**
  - `page`, `limit`, `ageMin`, `ageMax`, `professions`, `locations`, `education`, `interests`, `verified`, `premium`, `sortBy`, `sortOrder`
- **Validation:**
  - Pagination, age range, filter arrays, boolean filters, sorting
- **Returns:** Paginated, filtered profiles (demo data in static mode)

### **GET /api/profiles/:id**
- **Description:** Get a specific profile by ID
- **Validation:**
  - ID format and existence
- **Returns:** Profile info (limited for unauthenticated users)

### **PUT /api/profiles/:id**
- **Description:** Update a user profile (authenticated & owner only)
- **Body:** Partial profile fields
- **Validation:**
  - Field types, allowed fields, value ranges, ownership
- **Returns:** Updated profile

---

## Upload Controller (`/api/upload`)

### **POST /api/upload/single**
- **Description:** Upload a single file (authenticated)
- **Form Data:** `file`, `category`
- **Validation:**
  - File type, size, extension, content, category
  - Rate limiting per user and IP
- **Returns:** File metadata, URL

### **POST /api/upload/multiple**
- **Description:** Upload multiple files (authenticated)
- **Form Data:** `files[]`, `category`
- **Validation:**
  - As above, for each file
- **Returns:** Array of file metadata, errors for failed files

### **GET /api/upload/profile-images**
- **Description:** Get upload history for authenticated user
- **Query Params:** Pagination, category, sorting
- **Returns:** Paginated upload records

---

## Invitation Controller (`/api/invitations`)

### **POST /api/invitations**
- **Description:** Send an invitation to another user (authenticated)
- **Body:** `{ email: string, message?: string, profileId?: number }`
- **Validation:**
  - Email format, not self, message content, profileId
  - Rate limiting per email and IP
  - No duplicate pending invitations
- **Returns:** Invitation metadata

### **GET /api/invitations**
- **Description:** List invitations (sent/received/all, authenticated)
- **Query Params:** `page`, `limit`, `status`, `type`, `sortBy`, `sortOrder`
- **Returns:** Paginated invitations, stats

### **POST /api/invitations/:id/respond**
- **Description:** Accept or decline an invitation (recipient only)
- **Body:** `{ response: 'accept' | 'decline' }`
- **Validation:**
  - Invitation existence, ownership, status, expiration
- **Returns:** Updated invitation status

---

## **Validation & Security Highlights**
- All controllers use comprehensive input validation and sanitization
- Rate limiting is enforced per endpoint, user, and IP
- Static/demo mode uses in-memory/demo data; dev/prod use real DB/email
- All endpoints return detailed error codes and messages for troubleshooting

---

**For more details, see the source code in `backend/src/controllers/` and the API testing guide.** 