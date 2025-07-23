# Flexible Data Source Configuration Guide

## Overview

The ShaadiMantra backend now supports **flexible data source switching** between static/mock data and MongoDB without any hardcoded dependencies. This allows seamless development and testing across different environments.

## Configuration Modes

### 🔧 Static/Mock Mode
- **Port**: 4500
- **Database**: None required
- **Controllers**: Memory-based with static data
- **Use Case**: Development, testing, demos

### 🔧 MongoDB Mode  
- **Port**: 5500
- **Database**: MongoDB Atlas/Local required
- **Controllers**: Database-integrated
- **Use Case**: Production, integration testing

## Environment Configuration

### Data Source Selection
Set the `DATA_SOURCE` environment variable:

```bash
# Static/Mock mode
DATA_SOURCE=static

# MongoDB mode  
DATA_SOURCE=mongodb
```

### Port Configuration
- **Static Mode**: Automatically uses port 4500
- **MongoDB Mode**: Automatically uses port 5500
- **Override**: Set `PORT` environment variable to override

### Database Configuration
MongoDB credentials are only used when `DATA_SOURCE=mongodb`:

```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/...
DATABASE_NAME=shaadimantra_dev
```

## Quick Start Commands

### Mode Switching

```bash
# Switch to static mode
npm run mode:static

# Switch to MongoDB mode
npm run mode:mongodb

# Check current mode
npm run mode:status

# Show help
npm run mode:help
```

### Development Scripts

```bash
# Start in static mode (port 4500)
npm run dev:static

# Start in MongoDB mode (port 5500) 
npm run dev:mongodb

# Traditional development (uses .env configuration)
npm run dev
```

### Production Scripts

```bash
# Production static mode
npm run prod:static

# Production MongoDB mode
npm run prod:mongodb
```

## Manual Environment Setup

### Static Mode (.env.development)
```bash
DATA_SOURCE=static
# MONGODB_URI is ignored in static mode
```

### MongoDB Mode (.env.development)
```bash
DATA_SOURCE=mongodb
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/...
DATABASE_NAME=shaadimantra_dev
```

## Controller Architecture

The system automatically selects appropriate controllers based on `DATA_SOURCE`:

### Static Controllers
- `authController.js` - Memory-based authentication
- `profileController.js` - Static profile data
- `invitationController.js` - Mock invitations

### MongoDB Controllers  
- `authControllerMongo.js` - Database authentication
- `profileControllerMongo.js` - Database profiles
- `invitationControllerMongo.js` - Database invitations

## API Endpoints

Both modes support the same API interface:

```
POST /api/auth/send-otp
POST /api/auth/verify-otp  
POST /api/auth/refresh-token
POST /api/auth/logout
GET  /api/auth/profile
GET  /api/profiles/me
PUT  /api/profiles/me
GET  /api/profiles
POST /api/upload/single
POST /api/upload/multiple
POST /api/invitations
GET  /api/invitations/:code
```

## Health Monitoring

```bash
# Static mode health check
curl http://localhost:4500/health

# MongoDB mode health check  
curl http://localhost:5500/health
```

## Development Workflow

### 1. Frontend Development
```bash
npm run mode:static
npm run dev:static
# Frontend connects to port 4500
```

### 2. Backend Integration Testing
```bash
npm run mode:mongodb  
npm run dev:mongodb
# Frontend connects to port 5500
```

### 3. Production Deployment
```bash
DATA_SOURCE=mongodb npm run prod:mongodb
# Or use PM2 ecosystem configuration
```

## Configuration Benefits

### ✅ No Hardcoded Dependencies
- Environment-driven configuration
- No manual code changes required
- Clean separation of concerns

### ✅ Easy Mode Switching  
- One command to switch modes
- Automatic port management
- Clear mode indication

### ✅ Development Flexibility
- Test with mock data quickly
- Integrate with real database when needed
- Parallel development support

### ✅ Production Ready
- Same API interface regardless of mode
- Environment-specific optimizations
- Graceful error handling

## Troubleshooting

### Port Conflicts
```bash
# Check what's using the port
lsof -i :4500
lsof -i :5500

# Override port if needed
PORT=9000 npm run dev:static
```

### Mode Verification
```bash
# Check current configuration
npm run mode:status

# View environment info
curl http://localhost:4500/health
```

### Database Issues (MongoDB Mode)
```bash
# Test database connectivity
npm run env:check

# Check MongoDB connection
curl http://localhost:5500/api/database/status
```

## Frontend Integration

Update frontend API base URL based on backend mode:

```javascript
// Static mode
const API_BASE_URL = 'http://localhost:4500/api';

// MongoDB mode  
const API_BASE_URL = 'http://localhost:5500/api';

// Auto-detection
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'development' ? 
    'http://localhost:4500/api' : 'http://localhost:5500/api');
```

## Next Steps

1. **Frontend Configuration**: Update frontend to auto-detect backend mode
2. **Docker Support**: Add Docker configurations for both modes  
3. **Testing Integration**: Automated tests for both controller types
4. **CI/CD Pipeline**: Deploy different modes to different environments

This flexible configuration ensures zero hardcoded dependencies while maintaining development velocity and production reliability.
