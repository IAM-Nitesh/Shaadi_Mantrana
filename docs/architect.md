                    ┌─────────────────────────────┐
                    │     React Frontend          │
                    │   (Next.js + Capacitor)     │
                    │     PWA + Mobile Native     │
                    │     Port: 3000              │
                    │ • OTP-Only Login (Email)    │
                    │ • Swipe Matching UI         │
                    │ • Profile Management        │
                    │ • Real-time Chat (Socket.IO)│
                    │ • Privacy/Terms In-App      │
                    │ • Standardized Headers      │
                    │ • Filter System             │
                    │ • Matches Count Badges      │
                    └────────────┬────────────────┘
                                 │ HTTP/API Calls
                                 ▼
                    ┌─────────────────────────────┐
                    │  Express.js + Helmet API    │
                    │  (Secure Backend + Auth)    │
                    │     Port: 5050              │
                    │ • JWT Session Management    │
                    │ • Email-Only Authentication │
                    │ • Pre-approved Email Check  │
                    │ • Socket.IO Chat Server     │
                    │ • Connection Management     │
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
            │ - Approved List │         │ - Edit Workflow  │
            │ - Admin Access  │         │ - Field Validation│
            └─────────────────┘         └──────────────────┘
                      │                           │
                      ▼                           ▼
            ┌─────────────────┐       ┌──────────────────┐
            │ Security Layer  │       │ Matching Services│
            │ - Helmet        │       │ - Swipe Logic    │
            │ - Rate Limiting │       │ - Match/Unmatch  │
            │ - CORS Mobile   │       │ - Filter Engine  │
            │ - Input Sanitize│       │ - Age/Location   │
            │ - Request Logger│       │ - Profession     │
            │ - Error Handler │       │ - Daily Limits   │
            └─────────────────┘       └──────────────────┘
                      │                           │
                      ▼                           ▼
            ┌─────────────────┐       ┌──────────────────┐
            │ Chat Services   │       │ UI Components   │
            │ - Socket.IO     │       │ - StandardHeader │
            │ - Real-time     │       │ - FilterModal    │
            │ - 24h Auto-Clear│       │ - MatchAnimation │
            │ - Room Management│       │ - ModernNavigation│
            │ - Typing Indicators│     │ - HeartbeatLoader│
            │ - Connection Status│     │ - SwipeCard      │
            └─────────────────┘       └──────────────────┘
                      │                           │
                      ▼                           ▼
            ┌─────────────────┐       ┌──────────────────┐
            │ Connection Mgmt │       │ Mobile Features  │
            │ - Match Records │       │ - SplashScreen   │
            │ - Unmatch Logic │       │ - StatusBar      │
            │ - Chat History  │       │ - Keyboard       │
            │ - User Status   │       │ - Native Bridge  │
            │ - Badge Counts  │       │ - PWA Support    │
            └─────────────────┘       └──────────────────┘
                      │                           │
                      ▼                           ▼
            ┌─────────────────┐       ┌──────────────────┐
            │ Support Services│       │ Mobile Deployment│
            │ - Contact Info  │       │ - Android APK    │
            │ - Help Center   │       │ - App Store      │
            │ - Privacy API   │       │ - PWA Install    │
            │ - Terms API     │       │ - Auto Updates   │
            │ - Admin Panel   │       │ - Offline Support│
            └─────────────────┘       └──────────────────┘
                      │                           │
                      ▼                           ▼
            ┌─────────────────┐       ┌──────────────────┐
            │ Data Storage    │       │ Monitoring Stack │
            │ - MongoDB Atlas │       │ - Prometheus     │
            │ - Profile Data  │       │ - Grafana        │
            │ - Match Records │       │ - System Metrics │
            │ - User Sessions │       │ - App Analytics  │
            │ - Chat Messages │       │ - Error Tracking │
            │ - Connection DB │       └──────────────────┘
            └─────────────────┘                   │
                      │                           ▼
                      ▼               ┌──────────────────┐
            ┌─────────────────┐       │ Infrastructure   │
            │ File Storage    │       │ - Express Server │
            │ - Backblaze B2  │       │ - Secure Sessions│
            │ - S3 Compatible │       │ - Error Handling │
            │ - Image Assets  │       │ - Load Balancing │
            │ - Compression   │       │ - Rate Limiting  │
            │ - CDN Ready     │       │ - CORS Config    │
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
                  │ - Microservices Split      │
                  │ - Kubernetes Deployment    │
                  └────────────────────────────┘


# Tech Stack Overview

| Layer      | Technology/Tool                                      |
|------------|------------------------------------------------------|
| Frontend   | Next.js, React, TypeScript, Tailwind CSS, GSAP, Framer Motion |
| Backend    | Node.js, Express.js, Mongoose, JWT, Nodemailer, Socket.IO |
| Database   | MongoDB                                              |
| DevOps     | .env config, Postman, Markdown docs                  |
| Mobile     | Capacitor (optional)                                 |

# Recent Updates & Features

## UI/UX Improvements
- **Standardized Headers**: All pages (Discover, Matches, Profile) now use consistent header design with Shaadi Mantra branding
- **Filter System**: Functional filter modal available on all pages with age range, profession, and location filtering
- **Edit Button Behavior**: Profile edit button disappears during editing and reappears only after saving
- **Matches Count Badges**: Red circular badges show mutual match count on navigation icons
- **Chat Interface**: Real-time messaging with Socket.IO, typing indicators, and connection status

## Backend Enhancements
- **Socket.IO Integration**: Real-time chat functionality with room management
- **Connection Management**: Proper handling of matches, unmatching, and chat connections
- **Enhanced Authentication**: Improved JWT handling and user session management
- **Data Validation**: Comprehensive field validation for profile updates

## Mobile Optimizations
- **Responsive Design**: All components optimized for mobile devices
- **Touch Interactions**: Improved swipe gestures and touch feedback
- **Performance**: Optimized loading states and animations
- **Offline Support**: Graceful handling of network connectivity issues

## Security & Performance
- **Rate Limiting**: Enhanced protection against abuse
- **CORS Configuration**: Proper cross-origin resource sharing
- **Error Handling**: Comprehensive error management and user feedback
- **Data Sanitization**: Input validation and sanitization throughout the app



to be implemented
logging used loki and pro
 Logflare (for Cloudflare or Vercel)
 
Notification 
Firebase Cloud Messaging (FCM)
