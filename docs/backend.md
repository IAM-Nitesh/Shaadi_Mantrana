centralized MongoDB connection controller implemented in backend/src/services/databaseService.js!

Features Already Supported
Environment-aware: Loads connection string and options from your config, which is .env-driven.
Atlas & Local Support: Handles both MongoDB Atlas and local MongoDB, with specific options for each.
Connection Pooling & Retry: Retries on failure, with different pool sizes for dev/prod.
Native & Mongoose Clients: Optionally pings Atlas with the native driver for health checks.
Graceful Shutdown: Handles SIGINT/SIGTERM for clean disconnects.
Health & Stats: Exposes health check and stats methods.
Singleton: Exports a single instance for use across your app.

# Frontend API URLs and Corresponding Express API CRUD Support

| Entity               | Frontend API URL/Call         | Express API Route             | Create | Read | Update | Delete |
|----------------------|-------------------------------|-------------------------------|--------|------|--------|--------|
| **Authentication**   |                               |                               |        |      |        |        |
| Authentication (OTP) | `/api/auth/send-otp`          | `/api/auth/send-otp`          |   ✅   |      |        |        |
| Authentication (OTP) | `/api/auth/verify-otp`        | `/api/auth/verify-otp`        |        |  ✅  |   ✅   |        |
| Authentication       | `/api/auth/refresh-token`     | `/api/auth/refresh-token`     |        |  ✅  |   ✅   |        |
| Authentication       | `/api/auth/logout`            | `/api/auth/logout`            |        |      |   ✅   |        |
| Authentication       | `/api/auth/preapproved/check` | `/api/auth/preapproved/check` |        |  ✅  |        |        |
| **User Profile**     |                               |                               |        |      |        |        |
| User Profile         | `/api/profiles/me`            | `/api/profiles/me`            |        |  ✅  |   ✅   |   ✅   |
| User Profile         | `/api/profiles/uuid/:uuid`    | `/api/profiles/uuid/:uuid`    |        |  ✅  |        |        |
| User Profile         | `/api/profiles`               | `/api/profiles`               |        |  ✅  |        |        |
| **Matching**         |                               |                               |        |      |        |        |
| Discovery            | `/api/matching/discovery`     | `/api/matching/discovery`     |        |  ✅  |        |        |
| Like Profile         | `/api/matching/like`          | `/api/matching/like`          |   ✅   |      |        |        |
| Pass Profile         | `/api/matching/pass`          | `/api/matching/pass`          |   ✅   |      |        |        |
| Liked Profiles       | `/api/matching/liked`         | `/api/matching/liked`         |        |  ✅  |        |        |
| Mutual Matches       | `/api/matching/matches`       | `/api/matching/matches`       |        |  ✅  |        |        |
| Match Stats          | `/api/matching/stats`         | `/api/matching/stats`         |        |  ✅  |        |        |
| Unmatch Profile      | `/api/matching/unmatch`       | `/api/matching/unmatch`       |        |      |   ✅   |        |
| **Connection**       |                               |                               |        |      |        |        |
| Connection           | `/api/connections`            | `/api/connections`            |   ✅   |  ✅  |        |        |
| Connection           | `/api/connections/:uuid`      | `/api/connections/:uuid`      |        |  ✅  |   ✅   |   ✅   |
| **File Upload**      |                               |                               |        |      |        |        |
| Image Upload         | `/api/upload/single`          | `/api/upload/single`          |   ✅   |      |        |        |
| Image Upload         | `/api/upload/multiple`        | `/api/upload/multiple`        |   ✅   |      |        |        |
| **Invitation**       |                               |                               |        |      |        |        |
| Invitation           | `/api/invitations`            | `/api/invitations`            |   ✅   |  ✅  |        |        |
| Invitation           | `/api/invitations/:code`      | `/api/invitations/:code`      |        |  ✅  |   ✅   |   ✅   |
| Bulk Invitations     | `/api/send-invitations/`      | `/api/send-invitations/`      |   ✅   |      |        |        |
| **Admin System**     |                               |                               |        |      |        |        |
| Admin Users          | `/api/admin/users`            | `/api/admin/users`            |   ✅   |  ✅  |        |        |
| Admin User Pause     | `/api/admin/users/:id/pause`  | `/api/admin/users/:id/pause`  |        |      |   ✅   |        |
| Admin User Resume    | `/api/admin/users/:id/resume` | `/api/admin/users/:id/resume` |        |      |   ✅   |        |
| Admin User Invite    | `/api/admin/users/:id/invite` | `/api/admin/users/:id/invite` |        |      |   ✅   |        |
| Admin Bulk Invites   | `/api/admin/users/send-bulk-invites` | `/api/admin/users/send-bulk-invites` |   ✅   |      |        |        |
| Admin Stats          | `/api/admin/stats`            | `/api/admin/stats`            |        |  ✅  |        |        |
| Admin User Invitations | `/api/admin/users/:id/invitations` | `/api/admin/users/:id/invitations` |        |  ✅  |        |        |
| **Chat**             |                               |                               |        |      |        |        |
| Chat Messages        | `/api/chat/:connectionId`     | `/api/chat/:connectionId`     |   ✅   |  ✅  |        |        |
| **Health**           |                               |                               |        |      |        |        |
| Health Check         | `/health`                     | `/health`                     |        |  ✅  |        |        |
| Database Status      | `/health/database`            | `/health/database`            |        |  ✅  |        |        |
| Database Status      | `/api/database/status`        | `/api/database/status`        |        |  ✅  |        |        |

---

**Legend:**
- ✅ = Supported operation
- Blank = Not supported or not applicable

**Notes:**
- Admin endpoints require admin authentication
- All endpoints use JWT authentication except where noted
- Rate limiting applies to OTP and API endpoints
- CORS is configured for frontend URLs
- Environment variables control all configuration 