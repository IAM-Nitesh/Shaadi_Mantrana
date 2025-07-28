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
| Authentication (OTP) | `/api/auth/send-otp`          | `/api/auth/send-otp`          |   ✅   |      |        |        |
| Authentication (OTP) | `/api/auth/verify-otp`        | `/api/auth/verify-otp`        |        |  ✅  |   ✅   |        |
| User Profile         | `/api/profiles/me`            | `/api/profiles/me`            |        |  ✅  |   ✅   |   ✅   |
| User Profile         | `/api/profiles/uuid/:uuid`    | `/api/profiles/uuid/:uuid`    |        |  ✅  |        |        |
| User Profile         | `/api/profiles`               | `/api/profiles`               |        |  ✅  |        |        |
| Invitation           | `/api/invitations`            | `/api/invitations`            |   ✅   |  ✅  |        |        |
| Invitation           | `/api/invitations/:code`      | `/api/invitations/:code`      |        |  ✅  |   ✅   |   ✅   |
| Connection           | `/api/connections`            | `/api/connections`            |   ✅   |  ✅  |        |        |
| Connection           | `/api/connections/:uuid`      | `/api/connections/:uuid`      |        |  ✅  |   ✅   |   ✅   |
| Image Upload         | `/api/upload/single`          | `/api/upload/single`          |   ✅   |      |        |        |
| Preapproved Email    | `/api/admin/approved-emails`  | `/api/admin/approved-emails`  |        |  ✅  |        |        |
| Preapproved Email    | `/api/approved-emails/add`    | `/api/approved-emails/add`    |   ✅   |      |        |        |
| Preapproved Email    | `/api/approved-emails/remove` | `/api/approved-emails/remove` |        |      |        |   ✅   |
| Other                | `/api/settings`               | (Not found)                   |        |      |        |        |
| Other                | `/api/help`                   | (Not found)                   |        |      |        |        |

---

**Blank cells** indicate missing CRUD support for that operation.
If you want to add or update any endpoint, ensure the corresponding controller and MongoDB schema support the required operation. 