# ShaadiMantra Development Setup Guide

## Prerequisites

Before setting up the development environment, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download](https://git-scm.com/)
- **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

## Environment Configuration

### 1. Environment Files Setup

Create environment files for different environments:

#### Development Environment (`.env.development`)
```bash
# Development Environment Configuration
NODE_ENV=development
PORT=5001

# Development MongoDB Connection
MONGODB_URI=mongodb+srv://shaadimantrauser_dev:ruIAPQu3FSYc7zFV@cluster0-m0freetier.hdkszsj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0-M0freeTier
DATABASE_NAME=shaadimantra_dev

# JWT Configuration
JWT_SECRET=dev-jwt-secret-key-2024-shaadi-mantra
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3001
FRONTEND_FALLBACK_URL=http://localhost:3000

# Email Configuration (Development - Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@shaadimantra.com
ENABLE_EMAIL=false

# Feature Flags
USE_STATIC_DEMO=false
ENABLE_RATE_LIMITING=true
DEBUG_MODE=true

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
```

#### Production Environment (`.env.production`)
```bash
# Production Environment Configuration
NODE_ENV=production
PORT=5000

# Production MongoDB Connection (Use your production cluster)
MONGODB_URI=your-production-mongodb-connection-string
DATABASE_NAME=shaadimantra

# JWT Configuration (Use strong secrets in production)
JWT_SECRET=your-super-secure-jwt-secret-256-bit-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL for CORS
FRONTEND_URL=https://yourdomain.com

# Email Configuration (Production)
SMTP_HOST=your-production-smtp-host
SMTP_PORT=587
SMTP_USER=your-production-email
SMTP_PASS=your-production-password
FROM_EMAIL=noreply@yourdomain.com
ENABLE_EMAIL=true

# Feature Flags
USE_STATIC_DEMO=false
ENABLE_RATE_LIMITING=true
DEBUG_MODE=false

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=/var/uploads
```

#### Local Development (`.env.local`) - Optional
```bash
# Local Development Overrides
NODE_ENV=development
PORT=5001

# Use development MongoDB for local testing
MONGODB_URI=mongodb+srv://shaadimantrauser_dev:ruIAPQu3FSYc7zFV@cluster0-m0freetier.hdkszsj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0-M0freeTier
DATABASE_NAME=shaadimantra_local

# Enable debug features
DEBUG_MODE=true
ENABLE_EMAIL=false
USE_STATIC_DEMO=true
```

### 2. Update Configuration Files

Update the main configuration file to handle environment-based settings:

**backend/src/config/index.js**
```javascript
// Load environment variables based on NODE_ENV
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

// Fallback to .env if environment-specific file doesn't exist
require('dotenv').config();

module.exports = {
  // Environment configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5001,
  
  // Database configuration with environment-based selection
  DATABASE: {
    URI: process.env.MONGODB_URI || 'mongodb+srv://shaadimantrauser_dev:ruIAPQu3FSYc7zFV@cluster0-m0freetier.hdkszsj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0-M0freeTier',
    NAME: process.env.DATABASE_NAME || 'shaadimantra_dev',
    OPTIONS: {
      retryWrites: true,
      w: 'majority',
      maxPoolSize: process.env.NODE_ENV === 'production' ? 10 : 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    }
  },
  
  // Frontend URL for CORS (support multiple environments)
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
  FRONTEND_FALLBACK_URL: process.env.FRONTEND_FALLBACK_URL || 'http://localhost:3000',
  
  // JWT configuration with strong defaults
  JWT: {
    SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-key-2024-shaadi-mantra',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    ALGORITHM: 'HS256',
    ISSUER: 'shaadi-mantra-api',
    AUDIENCE: 'shaadi-mantra-app'
  },
  
  // Email configuration
  EMAIL: {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@shaadimantra.com',
    ENABLED: process.env.ENABLE_EMAIL === 'true'
  },
  
  // File upload configuration
  UPLOAD: {
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'],
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
    MAX_FILES_PER_USER: 5
  },
  
  // API configuration
  API: {
    BASE_URL: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5001}`,
    VERSION: 'v1',
    RATE_LIMIT: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: process.env.NODE_ENV === 'production' ? 100 : 1000
    }
  },
  
  // Feature flags based on environment
  FEATURES: {
    USE_STATIC_DEMO: process.env.USE_STATIC_DEMO === 'true',
    ENABLE_EMAIL: process.env.ENABLE_EMAIL === 'true' && process.env.SMTP_HOST,
    ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',
    DEBUG_MODE: process.env.DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development',
    ENABLE_CORS: true,
    ENABLE_HELMET: process.env.NODE_ENV === 'production'
  },
  
  // Security configuration
  SECURITY: {
    BCRYPT_ROUNDS: process.env.NODE_ENV === 'production' ? 12 : 8,
    SESSION_SECRET: process.env.SESSION_SECRET || 'dev-session-secret',
    CORS_ORIGINS: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL]
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
  }
};
```

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/IAM-Nitesh/Shaadi_Mantra.git
cd Shaadi_Mantra
```

### 2. Install Dependencies

#### Backend Dependencies
```bash
cd backend
npm install
```

#### Frontend Dependencies  
```bash
cd ../frontend
npm install
```

#### Root Dependencies (if any)
```bash
cd ..
npm install
```

### 3. Environment Setup

Create your environment files:
```bash
# In the backend directory
cp .env.example .env.development
cp .env.example .env.production

# Edit the development environment file
nano .env.development
```

### 4. Database Setup

The development MongoDB cluster is already configured with the provided connection string. No additional setup required for development.

**Database Details:**
- **Development Cluster:** `cluster0-m0freetier.hdkszsj.mongodb.net`
- **Database Name:** `shaadimantra_dev`
- **Username:** `shaadimantrauser_dev`
- **Auto-indexing:** Enabled
- **Connection pooling:** Configured for development

## Running the Application

### Development Mode

#### Option 1: Using npm scripts
```bash
# Backend (from backend directory)
cd backend
npm run dev

# Frontend (from frontend directory, new terminal)
cd frontend  
npm run dev

# Or run both simultaneously (from root directory)
npm run dev
```

#### Option 2: Using specific environment
```bash
# Run with development environment explicitly
NODE_ENV=development npm run start

# Run with local environment overrides
NODE_ENV=local npm run start

# Run with debugging enabled
DEBUG=true NODE_ENV=development npm run start
```

#### Option 3: Using PM2 (recommended for development)
```bash
# Install PM2 globally
npm install -g pm2

# Start development environment
pm2 start ecosystem.config.js --env development

# View logs
pm2 logs

# Stop all processes
pm2 stop all
```

### Production Mode

#### Option 1: Standard production
```bash
# Build and start production
NODE_ENV=production npm run build
NODE_ENV=production npm start
```

#### Option 2: Using PM2 (recommended)
```bash
# Start production environment
pm2 start ecosystem.config.js --env production

# Monitor processes
pm2 monit
```

## Package.json Scripts Configuration

Add these scripts to your `backend/package.json`:

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "NODE_ENV=development nodemon src/index.js",
    "dev:local": "NODE_ENV=local nodemon src/index.js",
    "dev:debug": "NODE_ENV=development DEBUG=* nodemon src/index.js",
    "build": "echo 'Build process for production'",
    "prod": "NODE_ENV=production node src/index.js",
    "test": "NODE_ENV=test jest",
    "test:watch": "NODE_ENV=test jest --watch",
    "lint": "eslint src/**/*.js",
    "lint:fix": "eslint src/**/*.js --fix",
    "db:seed": "NODE_ENV=development node scripts/seed-database.js",
    "db:reset": "NODE_ENV=development node scripts/reset-database.js"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```

## PM2 Ecosystem Configuration

Create `ecosystem.config.js` in the root directory:

```javascript
module.exports = {
  apps: [
    {
      name: 'shaadimantra-backend-dev',
      script: 'backend/src/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'development',
        PORT: 5001
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5001,
        MONGODB_URI: 'mongodb+srv://shaadimantrauser_dev:ruIAPQu3FSYc7zFV@cluster0-m0freetier.hdkszsj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0-M0freeTier'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        instances: 'max',
        exec_mode: 'cluster'
      },
      watch: ['backend/src'],
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      log_file: 'logs/combined.log',
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'shaadimantra-frontend-dev',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      }
    }
  ]
};
```

## Development Tools & Extensions

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss", 
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-json"
  ]
}
```

### VS Code Settings
Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "files.associations": {
    "*.js": "javascript"
  }
}
```

## Environment Verification

### 1. Check Environment Loading
```bash
# Test development environment
NODE_ENV=development node -e "console.log(require('./backend/src/config'))"

# Test production environment  
NODE_ENV=production node -e "console.log(require('./backend/src/config'))"
```

### 2. Database Connection Test
```bash
# Test database connection
cd backend
node -e "
const config = require('./src/config');
const mongoose = require('mongoose');
mongoose.connect(config.DATABASE.URI)
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection failed:', err));
"
```

### 3. Health Check Endpoint
```bash
# Test API health
curl http://localhost:5001/api/health

# Expected response:
{
  "status": "ok",
  "environment": "development", 
  "database": "connected",
  "timestamp": "2025-07-22T10:30:00.000Z"
}
```

## Environment Switching Commands

### Quick Environment Switching
```bash
# Switch to development
export NODE_ENV=development && npm run dev

# Switch to production
export NODE_ENV=production && npm start

# Switch to local testing
export NODE_ENV=local && npm run dev

# One-time environment run
NODE_ENV=development npm run dev
```

### Environment Detection Script
Create `scripts/check-env.js`:
```javascript
#!/usr/bin/env node

const config = require('../backend/src/config');

console.log('🔧 Environment Configuration Check');
console.log('=====================================');
console.log(`Environment: ${config.NODE_ENV}`);
console.log(`Port: ${config.PORT}`);
console.log(`Database: ${config.DATABASE.URI.replace(/:[^:@]*@/, ':***@')}`);
console.log(`Frontend URL: ${config.FRONTEND_URL}`);
console.log(`Debug Mode: ${config.FEATURES.DEBUG_MODE}`);
console.log(`Email Enabled: ${config.FEATURES.ENABLE_EMAIL}`);
console.log('=====================================');

// Test database connection
const mongoose = require('mongoose');
mongoose.connect(config.DATABASE.URI, config.DATABASE.OPTIONS)
  .then(() => {
    console.log('✅ Database connection: SUCCESS');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database connection: FAILED');
    console.error(err.message);
    process.exit(1);
  });
```

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Issues
```bash
# Check if development DB is accessible
ping cluster0-m0freetier.hdkszsj.mongodb.net

# Test connection with mongo client
mongosh "mongodb+srv://shaadimantrauser_dev:ruIAPQu3FSYc7zFV@cluster0-m0freetier.hdkszsj.mongodb.net/"
```

#### 2. Port Already in Use
```bash
# Find process using port 5001
lsof -ti:5001

# Kill process using port
kill -9 $(lsof -ti:5001)

# Or use different port
PORT=5002 npm run dev
```

#### 3. Environment Variables Not Loading
```bash
# Check if .env file exists
ls -la .env*

# Verify environment loading
node -e "console.log(process.env.NODE_ENV)"
```

#### 4. Module Not Found Errors
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode

Enable comprehensive debugging:
```bash
DEBUG=* NODE_ENV=development npm run dev
```

This will show:
- Database connection logs
- JWT token operations
- Request/response cycles
- Error stack traces
- UUID tracking information

## Next Steps

1. **Database Seeding:** Run `npm run db:seed` to populate development data
2. **API Testing:** Use the provided Postman collection in `/docs/api-tests`
3. **Frontend Setup:** Follow frontend-specific setup in `frontend/README.md`
4. **Production Deployment:** See `DEPLOYMENT_GUIDE.md` for production setup

## Quick Start Summary

```bash
# 1. Clone and install
git clone https://github.com/IAM-Nitesh/Shaadi_Mantra.git
cd Shaadi_Mantra
cd backend && npm install

# 2. Setup environment
cp .env.example .env.development
# Edit .env.development with the provided MongoDB connection

# 3. Start development
npm run dev

# 4. Verify setup
curl http://localhost:5001/api/health
```

Your ShaadiMantra development environment is now ready! 🚀
