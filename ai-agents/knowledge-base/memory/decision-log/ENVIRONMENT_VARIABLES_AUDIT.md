# Environment Variables Audit - Complete Project Review

## 🔍 **Audit Summary**
This document provides a comprehensive audit of all environment variables used throughout the Shaadi Mantrana project, ensuring proper configuration for both development and production environments.

## 📋 **Backend Environment Variables**

### **Core Configuration**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `NODE_ENV` | Environment mode | ✅ | `development` | Must be `production` in production |
| `DATA_SOURCE` | Database source | ✅ | `mongodb` | Options: `mongodb`, `static` |
| `PORT` | Server port | ❌ | `5500` | Auto-detected if not set |
| `RENDER` | Render deployment flag | ❌ | `false` | Set to `true` in production |

### **Database Configuration**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `MONGODB_URI` | MongoDB connection string | ✅ | - | Production MongoDB URI |
| `MONGODB_NAME` | Database name | ❌ | `shaadimantra_prod` | Auto-detected from URI |
| `DEV_MONGODB_URI` | Development MongoDB URI | ❌ | - | Local development |
| `MONGODB_PRODUCTION_URI` | Production MongoDB URI | ❌ | - | Alternative production URI |
| `MONGODB_TEST_URI` | Test MongoDB URI | ❌ | - | Testing environment |

### **JWT Configuration**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `JWT_SECRET` | JWT signing secret | ✅ | - | Strong secret required |
| `JWT_EXPIRES_IN` | Access token expiry | ❌ | `24h` | JWT expiration time |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | ❌ | `7d` | Refresh token expiration |

### **Email Configuration**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `SMTP_HOST` | SMTP server host | ❌ | `smtp.gmail.com` | Email service host |
| `SMTP_PORT` | SMTP server port | ❌ | `587` | Email service port |
| `SMTP_USER` | SMTP username | ✅ | - | Email service username |
| `SMTP_PASS` | SMTP password | ✅ | - | Email service password |
| `EMAIL_FROM` | From email address | ❌ | `SMTP_USER` | Sender email |
| `EMAIL_FROM_NAME` | From name | ❌ | `Shaadi Mantrana Support` | Sender name |
| `ENABLE_EMAIL` | Enable email service | ❌ | `true` | Email service toggle |

### **Backblaze B2 Storage**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `B2_KEY_ID` | B2 application key ID | ✅ | - | B2 credentials |
| `B2_APP_KEY` | B2 application key | ✅ | - | B2 credentials |
| `B2_BUCKET_ID` | B2 bucket ID | ✅ | - | B2 bucket identifier |
| `B2_BUCKET_NAME` | B2 bucket name | ✅ | - | B2 bucket name |

### **Grafana Loki Logging**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `GRAFANA_LOKI_USER` | Loki username | ✅ | - | Loki authentication |
| `GRAFANA_LOKI_PASSWORD` | Loki password | ✅ | - | Loki authentication |
| `GRAFANA_LOKI_URL` | Loki endpoint URL | ❌ | Default Grafana Cloud | Loki service URL |

### **Production URLs**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `PRODUCTION_FRONTEND_URL` | Production frontend URL | ✅ | - | CORS and CSP |
| `PRODUCTION_API_URL` | Production API URL | ✅ | - | Health checks and redirects |
| `FRONTEND_URL` | Frontend URL | ❌ | `PRODUCTION_FRONTEND_URL` | CORS configuration |
| `FRONTEND_FALLBACK_URL` | Fallback frontend URL | ❌ | `PRODUCTION_FRONTEND_URL` | Backup CORS |

### **API Configuration**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `API_BASE_URL` | API base URL | ❌ | Auto-detected | API endpoint |
| `ENABLE_RATE_LIMITING` | Enable rate limiting | ❌ | `true` | Rate limiting toggle |

### **Rate Limiting**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `OTP_DAILY_LIMIT` | Daily OTP limit | ❌ | `20` (prod) / `50` (dev) | OTP restrictions |
| `OTP_SHORT_TERM_LIMIT` | Short-term OTP limit | ❌ | `10` (prod) / `20` (dev) | OTP restrictions |
| `OTP_VERIFY_LIMIT` | OTP verification limit | ❌ | `15` (prod) / `30` (dev) | OTP restrictions |

### **File Upload**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `MAX_FILE_SIZE` | Maximum file size | ❌ | `5MB` | File upload limit |
| `UPLOAD_DIR` | Upload directory | ❌ | `uploads` | File storage path |

### **Security Configuration**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `BCRYPT_ROUNDS` | Password hashing rounds | ❌ | `12` (prod) / `8` (dev) | Security strength |
| `SESSION_SECRET` | Session secret | ✅ | `dev-session-secret` | Session security |
| `ENABLE_HELMET` | Enable Helmet security | ❌ | `true` (prod) | Security headers |

### **Feature Flags**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `DEBUG_MODE` | Enable debug mode | ❌ | `false` (prod) / `true` (dev) | Debug features |
| `ENABLE_CORS` | Enable CORS | ❌ | `true` | Cross-origin requests |
| `ENABLE_ANALYTICS` | Enable analytics | ❌ | `true` | Analytics features |

## 🌐 **Frontend Environment Variables**

### **Core Configuration**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `NODE_ENV` | Environment mode | ✅ | `development` | Must be `production` in production |

### **API Configuration**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | ✅ | - | Backend endpoint |

### **Application Information**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `NEXT_PUBLIC_APP_NAME` | Application name | ❌ | `Shaadi Mantrana` | App branding |
| `NEXT_PUBLIC_APP_VERSION` | Application version | ❌ | `1.0.0` | App version |

### **Feature Flags**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `NEXT_PUBLIC_ENABLE_DEBUG` | Enable debug mode | ❌ | `false` | Debug features |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics | ❌ | `true` | Analytics features |

### **Backblaze B2 Configuration**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `NEXT_PUBLIC_B2_BUCKET_NAME` | B2 bucket name | ❌ | - | File access (copy from backend) |
| `NEXT_PUBLIC_B2_BUCKET_ID` | B2 bucket ID | ❌ | - | File access (copy from backend) |

### **Grafana Loki Configuration**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `NEXT_PUBLIC_GRAFANA_LOKI_USER` | Loki username | ❌ | - | Client-side logging (copy from backend) |
| `NEXT_PUBLIC_GRAFANA_LOKI_PASSWORD` | Loki password | ❌ | - | Client-side logging (copy from backend) |
| `NEXT_PUBLIC_GRAFANA_LOKI_URL` | Loki endpoint URL | ❌ | - | Client-side logging (copy from backend) |

### **Security Configuration**
| Variable | Purpose | Required | Default | Notes |
|----------|---------|----------|---------|-------|
| `NEXT_PUBLIC_ENABLE_HTTPS` | Enable HTTPS | ❌ | `true` | Security requirement |
| `NEXT_PUBLIC_ENABLE_SECURE_COOKIES` | Enable secure cookies | ❌ | `true` | Cookie security |

## 🔧 **Environment-Specific Configuration**

### **Development Environment**
```bash
NODE_ENV=development
DATA_SOURCE=mongodb
PORT=5500
DEBUG_MODE=true
BCRYPT_ROUNDS=8
ENABLE_HELMET=false
```

### **Production Environment**
```bash
NODE_ENV=production
DATA_SOURCE=mongodb
PORT=5500
RENDER=true
DEBUG_MODE=false
BCRYPT_ROUNDS=12
ENABLE_HELMET=true
```

## 📁 **Files Using Environment Variables**

### **Backend Files**
- `src/config/index.js` - Main configuration loader
- `src/index.js` - Server configuration and CORS
- `src/controllers/authControllerMongo.js` - Authentication and cookies
- `src/services/b2StorageService.js` - B2 storage service
- `src/services/emailService.js` - Email service
- `observability/promtail.yaml` - Logging configuration

### **Frontend Files**
- `src/services/configService.ts` - Configuration service
- `src/services/image-upload-service.ts` - Image upload service
- `pages/api/**/*.ts` - API route handlers
- `next.config.js` - Next.js configuration

## ✅ **Validation and Testing**

### **Backend Validation**
```bash
cd backend
node scripts/validate-env.js
node scripts/setup-production-env.js
```

### **Frontend Validation**
```bash
cd frontend
node scripts/validate-env.js
```

## 🚨 **Critical Production Variables**

These variables **MUST** be set in production:

### **Backend (Render)**
```bash
NODE_ENV=production
RENDER=true
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
SESSION_SECRET=<your-generated-session-secret>
SMTP_PASS=<your-smtp-password>
B2_KEY_ID=<your-b2-key-id>
B2_APP_KEY=<your-b2-app-key>
B2_BUCKET_ID=<your-b2-bucket-id>
B2_BUCKET_NAME=<your-b2-bucket-name>
GRAFANA_LOKI_USER=<your-loki-username>
GRAFANA_LOKI_PASSWORD=<your-loki-password>
PRODUCTION_FRONTEND_URL=https://shaadi-mantrana-app-frontend.vercel.app
PRODUCTION_API_URL=https://shaadi-mantrana.onrender.com
```

### **Frontend (Vercel)**
```bash
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://shaadi-mantrana.onrender.com
NEXT_PUBLIC_B2_BUCKET_NAME=<copy-from-backend>
NEXT_PUBLIC_B2_BUCKET_ID=<copy-from-backend>
```

## 🔍 **Common Issues and Solutions**

### **Issue 1: Environment Not Detected as Production**
**Solution**: Ensure `NODE_ENV=production` and `RENDER=true` are set

### **Issue 2: Cookies Not Secure in Production**
**Solution**: Verify HTTPS is enabled and environment is detected correctly

### **Issue 3: CORS Errors**
**Solution**: Check `PRODUCTION_FRONTEND_URL` is set correctly

### **Issue 4: Missing Environment Variables**
**Solution**: Use validation scripts to identify missing variables

## 📝 **Next Steps**

1. **Create `.env.production` files** for both backend and frontend
2. **Set all required variables** in Render and Vercel dashboards
3. **Test environment detection** using validation scripts
4. **Deploy and verify** all variables are working correctly
5. **Monitor logs** for any environment-related issues

---

**Remember**: The key to fixing the production logout issue is ensuring all environment variables are properly set, especially `NODE_ENV=production` and `RENDER=true`.
