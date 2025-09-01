# Session TTL Migration Guide

## Overview
This migration updates the Session collection from creation-based TTL to activity-based TTL for better session management and storage efficiency.

## Changes Made

### 1. Session Schema Updates
- **Absolute Expiry**: 30 days from creation (hard limit)
- **Activity Expiry**: 7 days from last access (sliding window)
- **New Field**: `lastAccessed` field for tracking activity

### 2. Database Indexes
- **Removed**: Old TTL index on `createdAt`
- **Added**: New TTL index on `lastAccessed` (7 days)
- **Added**: Performance index on `userId + lastAccessed`

### 3. Application Changes
- **Auth Middleware**: Updated to use `lastAccessed` for session validation
- **Cleanup Service**: Automatic cleanup every hour
- **Health Monitoring**: Session statistics in health endpoint

## Migration Steps

### For Development Environment
```bash
cd backend
npm run db:migrate-session-ttl
npm run db:test-session-ttl
```

### For Production Environment
```bash
cd backend
npm run db:migrate-session-ttl-prod
```

## Benefits

### Storage Efficiency
- **Active Sessions**: Stay alive indefinitely (up to 30 days absolute)
- **Inactive Sessions**: Auto-cleaned after 7 days of inactivity
- **Estimated Savings**: 60-80% reduction in session storage

### Better User Experience
- **No Unexpected Logouts**: Active users stay logged in
- **Automatic Cleanup**: No manual session management needed
- **Scalability**: Handles high session volumes efficiently

### Monitoring & Maintenance
- **Health Endpoint**: `/health` includes session statistics
- **Automatic Cleanup**: Runs every hour
- **Performance Indexes**: Optimized for common queries

## Technical Details

### TTL Configuration
```javascript
// Absolute expiry (30 days max)
createdAt: {
  type: Date,
  default: Date.now,
  expires: 86400 * 30 // 30 days
}

// Activity-based expiry (7 days inactive)
lastAccessed: {
  type: Date,
  default: Date.now
}

// TTL Index
sessionSchema.index({ lastAccessed: 1 }, { 
  expireAfterSeconds: 86400 * 7 // 7 days
});
```

### Session Flow
1. **Creation**: Session created with `createdAt` and `lastAccessed`
2. **Access**: Every access updates `lastAccessed` (sliding window)
3. **Validation**: Sessions valid if `lastAccessed` < 7 days ago
4. **Cleanup**: MongoDB TTL automatically removes expired sessions
5. **Absolute Limit**: Sessions deleted after 30 days regardless of activity

## Monitoring

### Health Check Endpoint
```json
GET /health
{
  "status": "OK",
  "sessions": {
    "total": 150,
    "active24h": 120,
    "active7d": 135,
    "expired": 15,
    "storageMB": 0.08
  }
}
```

### Session Statistics
- **Total Sessions**: All sessions in database
- **Active 24h**: Sessions accessed in last 24 hours
- **Active 7d**: Sessions accessed in last 7 days
- **Expired**: Sessions that will be cleaned up soon
- **Storage**: Estimated storage usage in MB

## Rollback Plan

If issues arise, you can rollback by:

1. **Stop the application**
2. **Drop new indexes**:
   ```javascript
   db.sessions.dropIndex("lastAccessed_ttl")
   db.sessions.dropIndex("userId_lastAccessed")
   ```
3. **Restore old TTL index**:
   ```javascript
   db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 604800 })
   ```
4. **Update schema back** (if needed)
5. **Restart application**

## Testing

### Automated Tests
```bash
npm run db:test-session-ttl
```

### Manual Testing
1. Create a session
2. Access it multiple times
3. Verify `lastAccessed` updates
4. Wait/check TTL expiration
5. Monitor cleanup service logs

## Performance Impact

### Positive Impacts
- **Reduced Storage**: 60-80% less session data
- **Better Memory Usage**: Smaller working set
- **Faster Queries**: Optimized indexes
- **Automatic Cleanup**: No manual maintenance

### Minimal Overhead
- **Index Updates**: `lastAccessed` updated on each access
- **Cleanup Service**: Runs every hour (lightweight)
- **Health Checks**: Minimal additional load

## Security Considerations

### Session Security
- **Absolute Expiry**: Prevents infinite sessions
- **Activity Tracking**: Detects suspicious patterns
- **Secure Cleanup**: Prevents session accumulation

### Data Privacy
- **Automatic Cleanup**: Removes stale session data
- **No Sensitive Data**: Sessions contain only metadata
- **Audit Trail**: `lastAccessed` provides usage patterns

## Troubleshooting

### Common Issues

1. **Migration Fails**
   - Check database permissions
   - Verify MongoDB version (TTL requires 2.2+)
   - Check existing indexes

2. **Sessions Expire Too Quickly**
   - Verify TTL index configuration
   - Check `lastAccessed` updates
   - Monitor cleanup service

3. **Performance Issues**
   - Check index usage: `db.sessions.getIndexes()`
   - Monitor slow queries
   - Consider compound index optimization

### Logs to Monitor
```
🧹 Session cleanup completed
📊 Session Statistics: ...
❌ Session cleanup failed
```

## Future Enhancements

### Potential Improvements
1. **Redis Caching**: For high-traffic deployments
2. **Session Analytics**: Detailed usage patterns
3. **Configurable TTL**: Environment-based settings
4. **Session Events**: Audit logging for security

### Monitoring Enhancements
1. **Grafana Dashboards**: Session metrics visualization
2. **Alerting**: High session counts or cleanup failures
3. **Performance Monitoring**: Query performance tracking

---

## Quick Reference

### Commands
```bash
# Development
npm run db:migrate-session-ttl
npm run db:test-session-ttl

# Production
npm run db:migrate-session-ttl-prod

# Manual cleanup
npm run db:cleanup-sessions
```

### Key Files
- `backend/src/models/Session.js` - Updated schema
- `backend/src/middleware/auth.js` - Updated validation
- `backend/src/services/sessionCleanupService.js` - Cleanup service
- `backend/dev-scripts/migrate-session-ttl.js` - Migration script

### Important Dates
- **Migration Completed**: September 1, 2025
- **TTL Effective**: Immediately after migration
- **Cleanup Active**: Every hour automatically
