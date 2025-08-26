# Environment Setup Guide

This guide explains how to set up environment variables for both frontend and backend development.

## Frontend Environment Setup

Create a `.env.development` file in the `frontend/` directory with the following content:

```env
# Frontend Development Environment Variables
NEXT_PUBLIC_API_BASE_URL=http://localhost:5500
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Shaadi Mantrana
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

## Backend Environment Setup

Create a `.env.development` file in the `backend/` directory with the following content:

```env
# Backend Development Environment Variables
NODE_ENV=development
PORT=5500
DATA_SOURCE=mongodb

# Frontend URLs for CORS
FRONTEND_URL=http://localhost:3000
FRONTEND_FALLBACK_URL=http://localhost:3000

# API Configuration
API_BASE_URL=http://localhost:5500

# Database Configuration
MONGODB_URI=
DATABASE_NAME=shaadimantra_dev

# JWT Configuration
JWT_SECRET=
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
EMAIL_FROM_NAME=Shaadi Mantrana Support
ENABLE_EMAIL=true

# Rate Limiting
OTP_DAILY_LIMIT=50
OTP_SHORT_TERM_LIMIT=20
OTP_VERIFY_LIMIT=30

# Debug Mode
DEBUG_MODE=true
```

## Environment Variables Explained

### Frontend Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL | `http://localhost:5500` |
| `NEXT_PUBLIC_FRONTEND_URL` | Frontend application URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `Shaadi Mantrana` |
| `NEXT_PUBLIC_APP_VERSION` | Application version | `1.0.0` |
| `NEXT_PUBLIC_ENABLE_DEBUG` | Enable debug mode | `true` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics | `false` |

### Backend Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `NODE_ENV` | Node environment | `development` |
| `PORT` | Server port | `5500` |
| `DATA_SOURCE` | Data source type | `mongodb` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `API_BASE_URL` | API base URL | `http://localhost:5500` |
| `MONGODB_URI` | MongoDB connection string | (provide in environment) |
| `JWT_SECRET` | JWT secret key | (provide in environment) |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | Email username | (provide in environment) |
| `SMTP_PASS` | Email app password | (provide in environment) |
| `EMAIL_FROM` | From email address | (provide in environment) |
| `EMAIL_FROM_NAME` | From name | `Shaadi Mantrana Support` |
| `ENABLE_EMAIL` | Enable email sending | `true` |

## Usage in Code

### Frontend Usage

```typescript
import { config } from '../services/configService';

// Use environment variables
const apiUrl = config.apiBaseUrl;
const frontendUrl = config.frontendUrl;
```

### Backend Usage

```javascript
const config = require('./config');

// Use environment variables
const port = config.PORT;
const frontendUrl = config.FRONTEND_URL;
```

## Important Notes

1. **Frontend**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
2. **Backend**: All variables are server-side only
3. **Security**: Never commit `.env*` files to version control
4. **Secrets**: Move any real credentials into a secrets manager or local `.env` files that are gitignored. Replace values in example files with placeholders.
4. **Restart**: Always restart servers after changing environment variables

## Production Setup

For production, create `.env.production` files with appropriate values:

- Use HTTPS URLs
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Enable email functionality
- Set appropriate rate limits
- Disable debug mode

## Troubleshooting

1. **Port conflicts**: Change `PORT` in backend `.env.development`
2. **CORS errors**: Update `FRONTEND_URL` in backend `.env.development`
3. **API connection issues**: Verify `NEXT_PUBLIC_API_BASE_URL` in frontend `.env.development`
4. **Environment not loading**: Restart the development server 