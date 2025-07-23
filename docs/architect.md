                    ┌─────────────────────────────┐
                    │     React Frontend          │
                    │   (Next.js + Capacitor)     │
                    │     PWA + Mobile Native     │
                    │     Port: 3006              │
                    │ • OTP-Only Login (Email)    │
                    │ • Swipe Matching UI         │
                    │ • Profile Management        │
                    │ • Temporary Chat (24h)      │
                    │ • Privacy/Terms In-App      │
                    └────────────┬────────────────┘
                                 │ HTTP/API Calls
                                 ▼
                    ┌─────────────────────────────┐
                    │  Express.js + Helmet API    │
                    │  (Secure Backend + Auth)    │
                    │     Port: 5001              │
                    │ • JWT Session Management    │
                    │ • Email-Only Authentication │
                    │ • Pre-approved Email Check  │
                    └────────────┬────────────────┘
                                 │
                        ┌────────┴────────┐
                        ▼                 ▼
            ┌─────────────────┐         ┌──────────────────┐
            │ Auth Services   │         │ Profile Services │
            │ - OTP Generator │         │ - Profile CRUD   │
            │ - Email Sender  │         │ - Image Compress │
            │ - JWT Manager   │         │ - B2 Upload API  │
            │ - Session Store │         │ - Data Validation│
            │ - Approved List │         └──────────────────┘
            └─────────────────┘                   │
                      │                           ▼
                      ▼               ┌──────────────────┐
            ┌─────────────────┐       │ Matching Services│
            │ Security Layer  │       │ - Swipe Logic    │
            │ - Helmet        │       │ - Match/Unmatch  │
            │ - Rate Limiting │       │ - Filter Engine  │
            │ - CORS Mobile   │       │ - Age/Location   │
            │ - Input Sanitize│       │ - Profession     │
            └─────────────────┘       └──────────────────┘
                      │                           │
                      ▼                           ▼
            ┌─────────────────┐       ┌──────────────────┐
            │ Chat Services   │       │ Mobile Features  │
            │ - Match Chat    │       │ - SplashScreen   │
            │ - 24h Auto-Clear│       │ - StatusBar      │
            │ - Local Cache   │       │ - Keyboard       │
            │ - Message API   │       │ - Native Bridge  │
            └─────────────────┘       └──────────────────┘
                      │                           │
                      ▼                           ▼
            ┌─────────────────┐       ┌──────────────────┐
            │ Support Services│       │ Mobile Deployment│
            │ - Contact Info  │       │ - Android APK    │
            │ - Help Center   │       │ - App Store      │
            │ - Privacy API   │       │ - PWA Install    │
            │ - Terms API     │       │ - Auto Updates   │
            └─────────────────┘       └──────────────────┘
                      │                           │
                      ▼                           ▼
            ┌─────────────────┐       ┌──────────────────┐
            │ Data Storage    │       │ Monitoring Stack │
            │ - MongoDB Atlas │       │ - Prometheus     │
            │ - Profile Data  │       │ - Grafana        │
            │ - Match Records │       │ - System Metrics │
            │ - User Sessions │       │ - App Analytics  │
            └─────────────────┘       └──────────────────┘
                      │                           │
                      ▼                           ▼
            ┌─────────────────┐       ┌──────────────────┐
            │ File Storage    │       │ Infrastructure   │
            │ - Backblaze B2  │       │ - Express Server │
            │ - S3 Compatible │       │ - Secure Sessions│
            │ - Image Assets  │       │ - Error Handling │
            │ - Compression   │       │ - Load Balancing │
            └─────────────────┘       └──────────────────┘
                      │                           │
                      ▼                           ▼
                      └─────────┬─────────────────┘
                                ▼
                  ┌────────────────────────────┐
                  │    Future Production       │
                  │ - MongoDB Cluster Scale    │
                  │ - CDN for Global Assets    │
                  │ - Redis for Chat Cache     │
                  │ - WebSocket Real-time      │
                  └────────────────────────────┘

