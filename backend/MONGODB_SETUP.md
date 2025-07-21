# MongoDB Setup for ShaadiMantra - Development & Production

## Overview
This guide will help you set up MongoDB for both development and production environments for the ShaadiMantra application.

## Quick Start

### 1. Development Setup (Local MongoDB)

#### Option A: Local MongoDB Installation
```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb/brew/mongodb-community

# Ubuntu/Debian
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Windows
# Download from https://www.mongodb.com/try/download/community
```

#### Option B: MongoDB Atlas (Recommended)
1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster (M0 Sandbox - Free)
4. Set up database access (username/password)
5. Add IP address to whitelist (0.0.0.0/0 for development)
6. Get connection string

### 2. Environment Configuration

#### Development (.env)
```bash
# Copy the development example
cp .env.development.example .env

# Edit .env with your MongoDB settings
MONGODB_URI=mongodb://localhost:27017/shaadimantra_dev
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shaadimantra_dev

# Database settings
DB_MAX_POOL_SIZE=10
DB_CONNECT_TIMEOUT_MS=10000
DB_SERVER_SELECTION_TIMEOUT_MS=5000

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Email settings (optional for development)
EMAIL_SERVICE=console
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
```

#### Production (.env.production)
```bash
# MongoDB Atlas Production
MONGODB_URI=mongodb+srv://prod-user:secure-password@prod-cluster.mongodb.net/shaadimantra_prod?retryWrites=true&w=majority

# Production database settings
DB_MAX_POOL_SIZE=50
DB_CONNECT_TIMEOUT_MS=30000
DB_SERVER_SELECTION_TIMEOUT_MS=30000
DB_RETRY_ATTEMPTS=5
DB_RETRY_DELAY_MS=5000

# Strong JWT secret
JWT_SECRET=your-production-super-secure-jwt-secret-with-at-least-32-characters

# Production email service
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@shaadimantra.com

# Security
NODE_ENV=production
ALLOWED_ORIGINS=https://shaadimantra.com,https://www.shaadimantra.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 3. Database Models Overview

### User Model
- **Email**: Unique identifier and login
- **Profile**: Name, age, profession, location, education, about, interests, images
- **Verification**: Email verification status and approval type
- **Preferences**: Age range, location, profession filters for matching
- **Activity**: Login history, last active timestamp

### Invitation Model
- **Email & Code**: Invitation email and unique code
- **Status**: pending, sent, delivered, opened, accepted, expired, cancelled
- **Tracking**: Attempts, timestamps, sender information
- **Metadata**: IP address, user agent, source tracking

### Connection Model
- **Users**: Two users involved in the connection
- **Status**: pending, accepted, declined, blocked, expired
- **Type**: like, super_like, interest, match
- **Compatibility**: Matching score and factors
- **Timestamps**: Activity tracking

## 4. Starting the Application

### Development
```bash
# Install dependencies
npm install

# Start development server with nodemon
npm run dev

# Or start normally
npm start
```

### API Endpoints
Once running, the API will be available at:

#### Authentication
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and login/register
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

#### Profile Management
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update user profile
- `GET /api/profiles` - Get profiles for matching (with filters)

#### Invitations
- `POST /api/invitations` - Create new invitation
- `GET /api/invitations/:code` - Get invitation by code
- `GET /api/invitations` - List all invitations
- `PUT /api/invitations/:id/resend` - Resend invitation
- `DELETE /api/invitations/:id` - Cancel invitation

#### Health Check
- `GET /health` - Basic health check
- `GET /health/database` - Database connection status

## 5. Testing the Setup

### Manual Testing
1. Start the server: `npm run dev`
2. Test health endpoint: `curl http://localhost:3000/health`
3. Test database health: `curl http://localhost:3000/health/database`

### API Testing Examples

#### 1. Send OTP
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

#### 2. Verify OTP (use OTP from console logs)
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "otp": "123456"}'
```

#### 3. Get Profile (use access token from verify response)
```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 6. MongoDB Atlas Production Setup

### Creating Production Cluster
1. **Sign up/Login** to MongoDB Atlas
2. **Create Organization** (if needed)
3. **Create Project** (e.g., "ShaadiMantra Production")
4. **Build Cluster**:
   - Choose cloud provider (AWS, Google Cloud, Azure)
   - Select region closest to your users
   - Choose cluster tier (M10+ for production)
   - Configure additional settings

### Security Configuration
1. **Database Access**:
   - Create database user with readWrite permissions
   - Use strong password
   - Restrict to specific databases

2. **Network Access**:
   - Add your application server IPs
   - For development: 0.0.0.0/0 (not recommended for production)
   - For production: Specific IP addresses/ranges

3. **Connection String**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```

## 7. Monitoring and Maintenance

### Database Monitoring
- Use MongoDB Atlas monitoring dashboard
- Set up alerts for connection issues
- Monitor performance metrics

### Backup Strategy
- Atlas automated backups (enabled by default)
- Consider additional backup solutions for critical data

### Scaling Considerations
- Monitor connection pool usage
- Scale cluster tier based on load
- Implement read replicas for read-heavy workloads

## 8. Common Issues and Solutions

### Connection Issues
```javascript
// Check connection status
const dbStats = await DatabaseService.getConnectionStats();
console.log('DB Status:', dbStats);
```

### Authentication Errors
- Verify username/password in connection string
- Check IP whitelist in Atlas
- Ensure database user has correct permissions

### Performance Issues
- Add database indexes for frequently queried fields
- Monitor slow operations in Atlas
- Optimize query patterns

## 9. Development vs Production Differences

| Aspect | Development | Production |
|--------|-------------|------------|
| Database | Local MongoDB or Atlas M0 | Atlas M10+ cluster |
| Connection Pool | 10 connections | 50+ connections |
| Error Handling | Detailed errors | Generic error messages |
| Logging | Console logging | Structured logging service |
| Backup | Optional | Automated + manual |
| Monitoring | Basic health checks | Full monitoring suite |

## 10. Next Steps

1. **Set up your MongoDB** (local or Atlas)
2. **Configure environment variables**
3. **Start the application**: `npm run dev`
4. **Test the API endpoints**
5. **Configure production environment**
6. **Set up monitoring and alerts**

For any issues, check the server logs and MongoDB Atlas dashboard for connection and performance metrics.
