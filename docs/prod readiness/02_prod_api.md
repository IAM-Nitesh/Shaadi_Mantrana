# Backend API: Exact routes and payloads (quick reference)

Replace BASE_URL with your environment (e.g. http://localhost:5000 or https://api.example.com).

Auth
- POST BASE_URL/api/auth/signup
  - Request:
    ```json
    { "name":"Jane Doe", "email":"jane@example.com", "password":"S3cret!" }
    ```
  - Response (201):
    ```json
    { "userId":"u_123", "email":"jane@example.com", "createdAt":"2025-08-27T12:00:00Z" }
    ```

- POST BASE_URL/api/auth/login
  - Request:
    ```json
    { "email":"jane@example.com", "password":"S3cret!" }
    ```
  - Response (200):
    ```json
    { "accessToken":"<jwt_access_token>", "refreshToken":"<refresh_token>", "expiresIn":3600 }
    ```

- POST BASE_URL/api/auth/refresh
  - Request:
    ```json
    { "refreshToken":"<refresh_token>" }
    ```
  - Response:
    ```json
    { "accessToken":"<new_jwt>", "expiresIn":3600 }
    ```

User management
- GET BASE_URL/api/users/:userId
  - Response:
    ```json
    { "userId":"u_123","name":"Jane Doe","dob":"1990-01-01","gender":"female","location":"Delhi","images":["..."] }
    ```
- POST BASE_URL/api/users
  - Request:
    ```json
    { "userid":"u123","dob":"1990-01-01","gender":"female","location":"Delhi" }
    ```
- PUT BASE_URL/api/users/:userId
  - Request:
    ```json
    { "displayName":"Jane", "bio":"Loves travel", "images":["img1","img2"] }
    ```
- POST BASE_URL/api/users/:userId/avatar (multipart/form-data)
  - Form: avatar=@profile.jpg
  - Response:
    ```json
    { "fileKey":"profiles/u_123/profile.jpg","publicUrl":"https://..." }
    ```

Matches & Likes
- GET BASE_URL/api/matches?userId=U123
- POST BASE_URL/api/matches/like
  - Request:
    ```json
    { "fromUser":"U123", "toUser":"U456", "action":"like" }
    ```
- POST BASE_URL/api/matches/create
  - Request:
    ```json
    { "userA":"U123","userB":"U456","status":"matched","matchedAt":"2025-08-27T12:00:00Z" }
    ```

Chat
- GET BASE_URL/api/chat/threads?userId=U123
- GET BASE_URL/api/chat/threads/:threadId/messages
- POST BASE_URL/api/chat/threads/:threadId/messages
  - Request:
    ```json
    { "from":"U123","text":"Hi!","attachments":[],"sentAt":"2025-08-27T12:01:00Z" }
    ```

Invitations / Preapproved
- POST BASE_URL/api/invite
  - Request:
    ```json
    { "email":"invitee@example.com","invitedBy":"admin@domain.com" }
    ```
- POST BASE_URL/api/preapproved/convert
  - Request:
    ```json
    { "preapprovedId":"pa_001","convertToUser":true }
    ```

Admin & Approvals
- POST BASE_URL/api/admin/login
  - Request:
    ```json
    { "email":"admin@domain.com","password":"AdminPass" }
    ```
- POST BASE_URL/api/admin/users/:userId/approve
  - Request:
    ```json
    { "approvedBy":"admin123","notes":"OK" }
    ```

File uploads & signed URLs
- POST BASE_URL/api/uploads/signed-url
  - Request:
    ```json
    { "filename":"profile.jpg","contentType":"image/jpeg","folder":"profiles" }
    ```
  - Response:
    ```json
    { "url":"<signed_put_url>","publicUrl":"https://...","fileKey":"profiles/profile.jpg" }
    ```

- POST BASE_URL/api/uploads/complete
  - Request:
    ```json
    { "userId":"U123","fileKey":"profiles/profile.jpg","size":12345 }
    ```

Email / Notifications
- POST BASE_URL/api/notifications/email
  - Request:
    ```json
    { "to":"user@example.com","subject":"Welcome","template":"welcome","vars":{"name":"Jane"} }
    ```
- POST BASE_URL/api/notifications/push
  - Request:
    ```json
    { "userId":"U123","title":"New Match!","body":"You have a new match","data":{} }
    ```

Maintenance / admin scripts (HTTP if exposed)
- POST BASE_URL/api/admin/migrate
  - Request:
    ```json
    { "script":"migrate-to-new-schemas","dryRun":true }
    ```

...existing code...