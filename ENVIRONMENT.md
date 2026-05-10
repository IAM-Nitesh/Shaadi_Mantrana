# ENVIRONMENT CONFIGURATION
## Local Development
- **Frontend**: Next.js 15 (`npm run dev`)
- **Backend**: Node.js (`npm run dev:mongodb`)
- **Database**: Local MongoDB instance or Cloud Atlas.

## Deployment
- **Frontend**: Vercel
- **Backend**: Railway
- **Storage**: Backblaze B2 (for user uploads)
# ShaadiMantra Development Setup Guide

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Git**
- **VS Code** (recommended)

## Environment Configuration

### 1. Environment File

Create a `.env` file at the project root. Example:

```
# --- General ---
NODE_ENV=development
PORT=5500

# --- MongoDB ---
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/shaadimantra_dev?retryWrites=true&w=majority
MONGODB_PRODUCTION_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/shaadimantra?retryWrites=true&w=majority
MONGODB_TEST_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/shaadimantra_test?retryWrites=true&w=majority
DATABASE_NAME=shaadimantra_dev

# --- JWT ---
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# --- Email ---
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@shaadimantra.com
ENABLE_EMAIL=false

# --- API Base URL for Frontend ---
NEXT_PUBLIC_API_BASE_URL=http://localhost:5500
```

> Security: Never commit `.env` or `.env.*` files with real credentials. Use placeholders in repo examples and store real secrets in a local gitignored file or a secrets manager.

### 2. Install Dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 3. Running the Application

#### **Development Mode:**
```bash
npm run dev:backend
npm run dev:frontend
```

#### **Production Mode:**
```bash
npm run prod:backend
npm run prod:frontend
```

#### **Run Both:**
```bash
npm run dev:all
npm run prod:all
```

### 4. Linting & Code Cleanup

Run the linter and auto-fix issues:
```bash
cd frontend
npm run lint
npm run lint:fix # (if available)
```
- Remove unused variables, fix hook dependencies, and escape JSX characters as flagged by the linter.

### 5. Directory Structure

See `DIRECTORY_STRUCTURE.md` for a full overview of the project layout.

### 6. Troubleshooting
- If you see port conflicts, kill the process using the port (`lsof -ti:PORT` and `kill -9 PID`).
- If you see linter errors, follow the linter output to fix unused variables, dependencies, or JSX issues.
- For environment switching, just update `.env` and restart the relevant npm script.

---

Your ShaadiMantra development environment is now ready for MongoDB-based development and production workflows!
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
4. **Environment not loading**: Restart the development server # Environment Switching Guide

## 🔄 **Overview**
This guide explains how to switch between development and production environments in your Shaadi Mantrana project. The project automatically detects the environment and adjusts security settings, rate limiting, and features accordingly.

## 🚀 **Quick Start Commands**

### **Backend Environment Switching**
```bash
# Check current status
node scripts/switch-env.js status

# Switch to development mode
node scripts/switch-env.js dev

# Switch to production mode
node scripts/switch-env.js prod

# Validate configuration
node scripts/switch-env.js validate
```

### **Frontend Environment Switching**
```bash
# Check current status
node scripts/switch-env.js status

# Switch to development mode
node scripts/switch-env.js dev

# Switch to production mode
node scripts/switch-env.js prod

# Validate configuration
node scripts/switch-env.js validate
```

## 📋 **Environment Differences**

### **Development Mode (`NODE_ENV=development`)**
| Feature | Setting | Purpose |
|---------|---------|---------|
| **Cookies** | `secure: false`, `sameSite: 'lax'` | Allow HTTP localhost |
| **Rate Limiting** | 50 OTP/day, 20 OTP/hour | Lenient for testing |
| **Security** | Helmet disabled | Easier debugging |
| **Bcrypt** | 8 rounds | Faster development |
| **MongoDB Pool** | 5 connections | Development usage |
| **Debug Mode** | Enabled | Detailed logging |
| **CORS** | Localhost allowed | Local development |

### **Production Mode (`NODE_ENV=production`)**
| Feature | Setting | Purpose |
|---------|---------|---------|
| **Cookies** | `secure: true`, `sameSite: 'none'` | HTTPS security |
| **Rate Limiting** | 20 OTP/day, 10 OTP/hour | Prevent abuse |
| **Security** | Helmet enabled | Production security |
| **Bcrypt** | 12 rounds | Stronger security |
| **MongoDB Pool** | 10 connections | Production load |
| **Debug Mode** | Disabled | Performance & security |
| **CORS** | Production domains only | Security |

## 🔧 **Switching Methods**

### **Method 1: Using Environment Switching Scripts (Recommended)**

#### **Backend**
```bash
cd backend

# Check current status
node scripts/switch-env.js status

# Switch to development
node scripts/switch-env.js dev

# Switch to production
node scripts/switch-env.js prod

# Validate configuration
node scripts/switch-env.js validate
```

#### **Frontend**
```bash
cd frontend

# Check current status
node scripts/switch-env.js status

# Switch to development
node scripts/switch-env.js dev

# Switch to production
node scripts/switch-env.js prod

# Validate configuration
node scripts/switch-env.js validate
```

### **Method 2: Using Package.json Scripts**

#### **Backend Scripts**
```bash
# Development Mode
npm run dev                    # Development with MongoDB + nodemon
npm run dev:mongodb           # Development with MongoDB + nodemon
npm run dev:static            # Development with static data + nodemon
npm run dev:debug             # Development with debug logging

# Production Mode (Local Testing)
npm run prod                  # Production mode locally
npm run prod:mongodb          # Production mode with MongoDB
npm run prod:static           # Production mode with static data

# Start Production Server
npm start                     # Uses NODE_ENV from environment
```

#### **Frontend Scripts**
```bash
# Development Mode
npm run dev                   # Development server
npm run dev:remote-backend    # Development with remote backend

# Production Mode (Local Testing)
npm run build                 # Build for production
npm start                     # Start production server
```

### **Method 3: Environment Variable Override**

#### **Backend**
```bash
# Development
NODE_ENV=development npm start
NODE_ENV=development DATA_SOURCE=mongodb npm start

# Production
NODE_ENV=production npm start
NODE_ENV=production RENDER=true npm start
```

#### **Frontend**
```bash
# Development
NODE_ENV=development npm run dev

# Production
NODE_ENV=production npm run build
NODE_ENV=production npm start
```

### **Method 4: Permanent Environment Variables**

#### **Set in Shell Profile (Bash/Zsh)**
```bash
# Add to ~/.bashrc or ~/.zshrc
export NODE_ENV=development  # or production

# Reload profile
source ~/.bashrc  # or source ~/.zshrc
```

#### **Set in .env Files**
```bash
# Backend .env.development
NODE_ENV=development
DATA_SOURCE=mongodb
PORT=5500

# Backend .env.production
NODE_ENV=production
RENDER=true
DATA_SOURCE=mongodb
PORT=5500
```

## 🌐 **Deployment Environment Switching**

### **Render (Backend)**
```bash
# Set in Render Dashboard Environment Variables
NODE_ENV=production
RENDER=true
PRODUCTION_FRONTEND_URL=https://shaadi-mantrana-app-frontend.vercel.app
PRODUCTION_API_URL=https://shaadi-mantrana.onrender.com
```

### **Vercel (Frontend)**
```bash
# Set in Vercel Dashboard Environment Variables
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://shaadi-mantrana.onrender.com
```

## 🔍 **Verification Commands**

### **Check Current Environment**
```bash
# Backend
node scripts/switch-env.js status
node scripts/validate-env.js

# Frontend
node scripts/switch-env.js status
node scripts/validate-env.js
```

### **Check Environment Variables**
```bash
# Backend
echo $NODE_ENV
echo $RENDER
echo $VERCEL

# Frontend
echo $NODE_ENV
echo $VERCEL
```

### **Check Configuration**
```bash
# Backend
node -e "console.log('NODE_ENV:', process.env.NODE_ENV)"
node -e "console.log('RENDER:', process.env.RENDER)"

# Frontend
node -e "console.log('NODE_ENV:', process.env.NODE_ENV)"
node -e "console.log('VERCEL:', process.env.VERCEL)"
```

## 🚨 **Common Issues and Solutions**

### **Issue 1: Environment Not Switching**
**Symptoms**: `NODE_ENV` still shows old value
**Solutions**:
```bash
# Check if set correctly
echo $NODE_ENV

# Set explicitly
export NODE_ENV=production

# Use inline override
NODE_ENV=production npm start
```

### **Issue 2: Cookies Still Insecure in Production**
**Symptoms**: Cookies show `secure: false`
**Solutions**:
```bash
# Verify environment
node scripts/switch-env.js status

# Check HTTPS detection
curl -I https://your-domain.com/health

# Ensure NODE_ENV=production is set
```

### **Issue 3: Rate Limiting Not Applied**
**Symptoms**: OTP limits not enforced
**Solutions**:
```bash
# Check environment
node scripts/switch-env.js status

# Verify rate limiting is enabled
node -e "console.log('Rate limiting:', process.env.ENABLE_RATE_LIMITING)"
```

## 📝 **Environment-Specific Configuration**

### **Development Configuration**
```bash
# Backend
NODE_ENV=development
DATA_SOURCE=mongodb
PORT=5500
DEBUG_MODE=true
ENABLE_HELMET=false
BCRYPT_ROUNDS=8

# Frontend
NODE_ENV=development
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### **Production Configuration**
```bash
# Backend
NODE_ENV=production
RENDER=true
DATA_SOURCE=mongodb
PORT=5500
DEBUG_MODE=false
ENABLE_HELMET=true
BCRYPT_ROUNDS=12

# Frontend
NODE_ENV=production
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## 🎯 **Best Practices**

### **1. Always Check Status Before Switching**
```bash
node scripts/switch-env.js status
```

### **2. Validate Configuration After Switching**
```bash
node scripts/switch-env.js validate
```

### **3. Use Scripts for Consistency**
```bash
# Instead of manual export
export NODE_ENV=production

# Use the script
node scripts/switch-env.js prod
```

### **4. Test Both Environments Locally**
```bash
# Test development
NODE_ENV=development npm run dev

# Test production
NODE_ENV=production npm run prod
```

### **5. Verify Security Settings**
```bash
# Check cookie settings
node scripts/switch-env.js status

# Verify HTTPS detection
curl -I https://your-domain.com/health
```

## 🔄 **Quick Reference**

### **Development Mode**
```bash
# Backend
node scripts/switch-env.js dev
npm run dev

# Frontend
node scripts/switch-env.js dev
npm run dev
```

### **Production Mode**
```bash
# Backend
node scripts/switch-env.js prod
npm run prod

# Frontend
node scripts/switch-env.js prod
npm run build && npm start
```

### **Status Check**
```bash
# Backend
node scripts/switch-env.js status

# Frontend
node scripts/switch-env.js status
```

### **Validation**
```bash
# Backend
node scripts/switch-env.js validate

# Frontend
node scripts/switch-env.js validate
```

---

**Remember**: The key to fixing your production logout issue is ensuring `NODE_ENV=production` is set, which will trigger the correct cookie security settings (`secure: true` and `sameSite: none`) for HTTPS production environment.
