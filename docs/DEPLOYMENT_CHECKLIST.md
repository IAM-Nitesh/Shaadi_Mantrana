# Production Logout Fix - Deployment Checklist

## 🚀 Pre-Deployment Checklist

### 1. Code Changes ✅
- [x] Enhanced cookie security configuration
- [x] Improved environment detection
- [x] Enhanced authentication logging
- [x] Removed hardcoded production URLs
- [x] Added environment debugging headers

### 2. Environment Variables to Set in Render Dashboard

#### Required Variables:
```bash
NODE_ENV=production
RENDER=true
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
SMTP_PASS=<your-smtp-password>
B2_KEY_ID=<your-backblaze-key-id>
B2_APP_KEY=<your-backblaze-app-key>
GRAFANA_LOKI_USER=<your-loki-username>
GRAFANA_LOKI_PASSWORD=<your-loki-password>
```

#### Production URLs:
```bash
PRODUCTION_FRONTEND_URL=https://shaadi-mantrana-app-frontend.vercel.app
PRODUCTION_API_URL=https://shaadi-mantrana.onrender.com
```

### 3. Render Configuration

#### Build Command:
```bash
npm install && npm run build
```

#### Start Command:
```bash
npm start
```

#### Environment:
- [ ] Set `NODE_ENV=production`
- [ ] Set `RENDER=true`
- [ ] Verify all required variables are set

## 🔧 Deployment Steps

### Step 1: Deploy Code
1. Push all changes to your repository
2. Trigger Render deployment
3. Wait for build to complete

### Step 2: Verify Environment Variables
1. Go to Render Dashboard
2. Navigate to your service
3. Go to Environment tab
4. Verify all variables are set correctly

### Step 3: Test Deployment
1. Check service health endpoint: `/health`
2. Verify environment headers in response
3. Test authentication flow

## 🧪 Post-Deployment Testing

### 1. Health Check
```bash
curl https://shaadi-mantrana.onrender.com/health
```
**Expected Response Headers:**
```
X-Environment: production
X-Is-Production: true
```

### 2. Authentication Flow Test
1. **Send OTP** → Should work (already working)
2. **Verify OTP** → Should set secure cookies
3. **Check Status** → `/api/auth/status` should return authenticated user
4. **Navigate** → Protected routes should work

### 3. Cookie Verification
Check browser Network tab for:
- `Set-Cookie` headers with `secure` and `sameSite=none`
- No CORS errors
- Proper cookie transmission

## 📊 Monitoring and Verification

### Server Logs to Check
Look for these success indicators:
```
🔧 Environment Configuration:
   Environment: production
   Data Source: MONGODB
   Port: 5500

🔍 getAuthStatus: Environment: production
🔍 getAuthStatus: Request secure: true
🔍 getAuthStatus: X-Forwarded-Proto: https
✅ getAuthStatus: User authenticated successfully
```

### Response Headers to Verify
```
X-Environment: production
X-Is-Production: true
Set-Cookie: accessToken=...; Secure; SameSite=None; HttpOnly
```

## 🚨 Troubleshooting

### Issue 1: Environment Still Shows Development
**Solution**: Check `NODE_ENV=production` is set in Render

### Issue 2: Cookies Not Being Set
**Solution**: Verify HTTPS is enabled and `secure: true` is set

### Issue 3: CORS Errors
**Solution**: Check `PRODUCTION_FRONTEND_URL` is correctly set

### Issue 4: Authentication Still Failing
**Solution**: Check server logs for detailed error messages

## 📋 Rollback Plan

If issues persist:
1. Check Render environment variables
2. Verify MongoDB connection
3. Test with Postman
4. Review server logs
5. Consider rolling back to previous deployment

## ✅ Success Criteria

The fix is successful when:
- [ ] Environment shows as `production` in logs
- [ ] Cookies are set with `secure: true` and `sameSite: none`
- [ ] `/api/auth/status` returns authenticated user
- [ ] No immediate logout after login
- [ ] User can navigate to protected routes

## 📞 Support

If you need help:
1. Check the comprehensive troubleshooting guide: `docs/PRODUCTION_LOGOUT_ISSUE_FIX.md`
2. Review server logs for detailed error messages
3. Use the validation script: `node scripts/validate-env.js`
4. Check environment setup: `node scripts/setup-production-env.js`

## 🎯 Next Steps After Successful Deployment

1. **Monitor** authentication flow for 24-48 hours
2. **Test** with multiple users and devices
3. **Verify** all protected routes work correctly
4. **Check** server performance and response times
5. **Document** any additional issues found

---

**Remember**: The key to fixing the logout issue is ensuring the environment is correctly detected as `production` and cookies are set with the proper security attributes for HTTPS.
