# OTP Rate Limiting Configuration - Updated

## Summary of Changes

The daily limits for sending OTP via email have been significantly increased to provide a better user experience while maintaining security.

## New Rate Limiting Configuration

### Development Environment
- **Daily OTP Limit**: 50 requests per 24 hours (previously 5 per 15 minutes)
- **Short-term Limit**: 20 requests per 15 minutes (previously 5 per 15 minutes)
- **Verification Limit**: 30 attempts per 15 minutes (previously 5 per 15 minutes)

### Production Environment
- **Daily OTP Limit**: 20 requests per 24 hours
- **Short-term Limit**: 10 requests per 15 minutes
- **Verification Limit**: 15 attempts per 15 minutes

## Environment Variables

The following environment variables can be used to customize rate limits:

```bash
# Daily limit for OTP requests per IP (24 hours)
OTP_DAILY_LIMIT=20

# Short-term limit for OTP requests per IP (15 minutes)
OTP_SHORT_TERM_LIMIT=10

# Verification attempts limit per IP (15 minutes)
OTP_VERIFY_LIMIT=15
```

## Configuration Files Updated

1. **backend/src/config/index.js** - Added configurable rate limit settings
2. **backend/src/controllers/authControllerMongo.js** - Updated rate limiting logic
3. **backend/.env.development** - Added development-specific rate limits
4. **backend/.env.production** - Added production-specific rate limits
5. **backend/.env.template** - Added template with documentation

## Features

- **Dual-layer Rate Limiting**: Both daily and short-term limits to prevent abuse
- **Environment-based Configuration**: Different limits for development vs production
- **Configurable via Environment Variables**: Easy to adjust without code changes
- **Better Error Messages**: Clear feedback about retry times and limits
- **Email Service Integration**: OTP emails are now being sent via Gmail

## Testing

- ✅ Email service is working and sending actual emails
- ✅ Rate limiting is properly configured and enforced
- ✅ Authentication flow is working end-to-end
- ✅ JWT tokens are being generated with proper issuer/audience

## Impact

Users can now:
- Request up to 50 OTPs per day in development (20 in production)
- Make up to 20 short-term requests in development (10 in production)
- Have more verification attempts to account for typos

This provides a much more user-friendly experience while maintaining security against abuse.
